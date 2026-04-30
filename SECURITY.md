# Security Policy

## Reporting a Vulnerability

The ExamMaster team takes security vulnerabilities seriously. We appreciate your help in responsibly disclosing any issues.

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please send an email to the repository owner at [GitHub Issues](https://github.com/xmwengxing/ExamMaster/issues/new) with the subject line "Security Vulnerability Report".

Please include the following information:
- A description of the vulnerability
- Steps to reproduce the issue
- The affected version(s)
- Any potential mitigations you've identified

### What to Expect

- **Acknowledgment:** You will receive a response within 48 hours
- **Assessment:** The team will assess the vulnerability and determine its severity
- **Fix:** A fix will be developed and released as soon as possible
- **Credit:** With your permission, you will be credited in the release notes

## Security Best Practices for Deploying ExamMaster

1. **Change Default Credentials:** Immediately change the default admin password after first login
2. **Use Strong Passwords:** All passwords should be at least 16 characters with mixed case, numbers, and symbols
3. **Generate New Secrets:** Run `node scripts/generate-secure-passwords.js` to generate new `JWT_SECRET` and `DB_PASSWORD`
4. **HTTPS Only:** In production, always deploy behind HTTPS using a reverse proxy (nginx) with valid SSL certificates
5. **Restrict Network Access:** In production, bind PostgreSQL to localhost only (`127.0.0.1:54320`)
6. **Regular Updates:** Keep dependencies updated with `npm audit` and `npm update`
7. **.env File Protection:** Never commit `.env` files to version control; use `.env.example` as a template
8. **CORS Configuration:** Update `ALLOWED_ORIGINS` in `.env` to include only your production domain(s)
9. **File Upload Security:** Review upload size limits and allowed file types in production
10. **Backup:** Regularly backup your PostgreSQL database using the provided backup utilities

## Supported Versions

| Version | Supported |
|---------|-----------|
| Latest  | ✅ Yes    |

Only the latest version is currently supported with security updates.
