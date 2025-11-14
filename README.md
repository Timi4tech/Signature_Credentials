# Document Signature App

A fullstack application for digitally signing documents using C2PA (Coalition for Content Provenance and Authenticity) standards.

## 🚀 Features

- 🔐 Cryptographic document signing with C2PA
- ✅ Signature verification
- 📄 Support for multiple image formats
- 🔒 Privacy-safe metadata embedding
- 💾 Secure credential management

## 🛠️ Tech Stack

### Backend
- Node.js + Express
- C2PA-node (Content Authenticity)
- Sharp (Image processing)
- Multer (File uploads)
- Joi (Validation)

### Frontend
- React
- Vite
- Axios
- TailwindCSS (if used)

## 📦 Installation

### Backend Setup
```bash
cd backend
npm install

# Create .env file with your certificates
cp .env.example .env
# Edit .env and add your CERTIFICATE_KEY and PRIVATE_KEY

npm start
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 🔐 Environment Variables

### Backend `.env`
```
CERTIFICATE_KEY=<your-certificate-pem>
PRIVATE_KEY=<your-private-key-pem>
PORT=3000
```

### Generating Certificates
```bash
# Generate ES256 key pair
openssl ecparam -genkey -name prime256v1 -out private_key.pem
openssl req -x509 -new -key private_key.pem -out cert.pem -days 365
```

## 🚦 Usage

1. Start the backend server (port 3000)
2. Start the frontend dev server
3. Upload an image to sign
4. Verify signed images

## 📝 API Endpoints

- `POST /upload` - Sign an image with author credentials
- `POST /verify` - Verify a signed image's authenticity

## 🤝 Contributing

Contributions welcome! Please open an issue or submit a pull request.

## 📄 License

MIT License

## ⚠️ Security Notes

- Never commit `.env` files
- Never commit certificate files (`.pem`, `.key`)
- Keep `node_modules/` excluded
- Use environment variables for sensitive data
```

## Create `.env.example` Files

### `backend/.env.example`:
```
CERTIFICATE_KEY=your-certificate-here
PRIVATE_KEY=your-private-key-here
PORT=3000
```

### `frontend/.env.example`:
```
VITE_API_URL=http://localhost:3000
