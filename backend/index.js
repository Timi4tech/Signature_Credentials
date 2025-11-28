
import express from "express";
import joi from "joi";
import multer from "multer";
import sharp from "sharp";
import cors from "cors";
import dotenv from "dotenv"
import { Builder, LocalSigner, Reader } from '@contentauth/c2pa-node'

dotenv.config()

const app = express();
app.use(cors());

// Use memory storage - no disk writes
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 1000 * 1024 * 1024 }, // 1GB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, png, gif, webp)'));
    }
  }
});

// Joi schema for text fields only
const textFieldsSchema = joi.object({
  author: joi.string().min(2).max(100).trim().required().messages({
    "string.empty": "Author name is required",
    "string.min": "Author name must be at least 2 characters",
    "string.max": "Author name must be less than 100 characters",
    "any.required": "Author name is required"
  }),
  signature: joi.string().min(3).max(200).trim().required().messages({
    "string.empty": "Signature is required",
    "string.min": "Signature must be at least 3 characters",
    "string.max": "Signature must be less than 200 characters",
    "any.required": "Signature is required"
  }),
});

// SIGN ENDPOINT
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Please upload an image file" });
    }

    const { error: textError, value: textValue } = textFieldsSchema.validate({
      author: req.body.author,
      signature: req.body.signature,
    });

    if (textError) {
      return res.status(400).json({ error: textError.details[0].message });
    }

    const uploadedFile = req.file;
    const authorName = textValue.author;
    const userSignature = textValue.signature;

    // Convert to JPEG if not already
    if (!uploadedFile.mimetype.includes('jpeg') && !uploadedFile.mimetype.includes('jpg')) {
      uploadedFile.buffer = await sharp(uploadedFile.buffer)
        .jpeg({ quality: 95 })
        .toBuffer();
      uploadedFile.mimetype = 'image/jpeg';
      uploadedFile.originalname = uploadedFile.originalname.replace(/\.[^/.]+$/, ".jpg");
    }

    try {
      console.log("Embedding C2PA manifest (memory-only, privacy-safe)...");

      // Create buffers from environment variables
      const certificateBuffer = Buffer.from(
        process.env.CERTIFICATE_KEY.replace(/\\n/g, '\n')
      );

      const privateKeyBuffer = Buffer.from(
        process.env.PRIVATE_KEY.replace(/\\n/g, '\n')
      );

      // Create LocalSigner
      const signer = LocalSigner.newSigner(
        certificateBuffer,
        privateKeyBuffer,
        'es256',
        null
      );

      
      // Create manifest
      const manifest = {
        title: `${authorName} – Authenticated Image`,
        format: uploadedFile.mimetype,
        claim_generator: "SignatureApp/1.0"
      };

      // Create builder
      const builder = Builder.withJson(manifest);

      // Add assertions
      builder.addAssertion('c2pa.actions', [
        {
          action: "c2pa.created",
          softwareAgent: "SignatureApp/1.0",
          when: new Date().toISOString()
        }
      ]);

      builder.addAssertion('c2pa.author', { 
        name: authorName 
      });

      builder.addAssertion('c2pa.note', { 
        summary: `Signed via SignatureApp. Signature: ${userSignature}` 
      });

      // Create asset object
      const inputAsset = {
        buffer: uploadedFile.buffer,
        mimeType: uploadedFile.mimetype
      };

      const outputAsset={
        mimeType: uploadedFile.mimetype
      }

      // Sign the asset
      const signedAsset = builder.sign(
        signer,
        inputAsset,
        outputAsset
      );

      console.log("C2PA signing complete ✅");

      res.setHeader("Content-Type", uploadedFile.mimetype);
      res.setHeader("Content-Disposition", `attachment; filename="signed_${uploadedFile.originalname}"`);
      res.send(signedAsset);

    } catch (c2paErr) {
      console.error("C2PA signing failed:", c2paErr);
      res.status(500).json({ error: "C2PA signing failed: " + c2paErr.message });
    }

  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: err.message });
  }
});




app.post("/verify", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Please upload an image file to verify" });
    }

    try {
      const asset = {
        buffer: req.file.buffer,
        mimeType: req.file.mimetype
      };

      const reader = await Reader.fromAsset(asset);
      
      let activeManifest;
      try {
        activeManifest = reader.getActive();
      } catch (e) {
        return res.json({ 
          signed: false, 
          message: "No C2PA signature found", 
          verified: false 
        });
      }

      if (!activeManifest) {
        return res.json({ 
          signed: false, 
          message: "No C2PA signature found", 
          verified: false 
        });
      }

      // Get full manifest store for detailed info
      const manifestStore = reader.json();

      // Extract assertions with better error handling
      const assertions = activeManifest.assertions || {};
      const actions = assertions['c2pa.actions'] || [];
      const author = assertions['c2pa.author'] || null;
      const note = assertions['c2pa.note'] || null;

      // Try multiple ways to get the issuer
      const issuer = activeManifest.claim_generator 
        || activeManifest.issuer 
        || (activeManifest.signature_info && activeManifest.signature_info.issuer)
        || (activeManifest.claim_generator_info && activeManifest.claim_generator_info[0] && activeManifest.claim_generator_info[0].name)
        || "Unknown";

      // Extract signature info
      const signatureInfo = activeManifest.signature_info || {};
      const algorithm = signatureInfo.alg || signatureInfo.algorithm || 'es256';
      const timestamp = signatureInfo.time || signatureInfo.timestamp || activeManifest.timestamp || new Date().toISOString();

      // Build process/actions timeline
      const processTimeline = actions.map(action => ({
        action: action.action,
        softwareAgent: action.softwareAgent || action.software_agent || action.tool,
        when: action.when || action.timestamp,
        parameters: action.parameters || null
      }));

      // Get ingredients
      const ingredients = (activeManifest.ingredients || []).map(ing => ({
        title: ing.title || 'Untitled',
        format: ing.format || ing.mime_type,
        relationship: ing.relationship,
        issuer: ing.claim_generator || ing.issuer || 'Unknown'
      }));

      return res.json({
        signed: true,
        verified: true,
        content: {
          filename: req.file.originalname,
          title: activeManifest.title || req.file.originalname,
          issuer: issuer,
          format: req.file.mimetype
        },
        process: {
          appOrDeviceUsed: processTimeline[0]?.softwareAgent || issuer,
          actions: processTimeline.map(p => ({
            type: p.action,
            tool: p.softwareAgent,
            timestamp: p.when
          }))
        },
        ingredients: ingredients,
        credential: {
          issuedBy: issuer,
          algorithm: algorithm,
          timestamp: timestamp
        },
        author: author ? {
          name: author.name || author.creator,
          identifier: author.identifier || author.id || null
        } : null,
        note: note ? (note.summary || note.text || note.description) : null,
        
        // Include raw data for debugging
        rawManifest: activeManifest,
        manifestStore: manifestStore
      });

    } catch (e) {
      console.error('Could not fetch active manifest:', e.message);
      console.error('Full error:', e);
      return res.json({ 
        signed: false, 
        message: 'Could not read C2PA data: ' + e.message, 
        verified: false 
      });
    }

  } catch (err) {
    console.error('Verification error:', err);
    res.status(500).json({ 
      error: err.message, 
      signed: false, 
      verified: false 
    });
  }
});

app.get("/", (req, res) => {
  res.json({ 
    status: "ok", 
    message: "SignatureApp C2PA API is running",
    version: "1.0.0",
    endpoints: {
      health: "GET /health",
      upload: "POST /upload - Sign an image with C2PA credentials",
      verify: "POST /verify - Verify C2PA signature in an image"
    }
  });
});

app.get("/health", (req, res) => {
  res.json({ 
    status: "healthy", 
    timestamp: new Date().toISOString()
  });
});

app.listen(3000, () => {
  console.log('Server running @3000')
});