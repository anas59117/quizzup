# App Store Compliance Answers

## Export Compliance (ECCN/EAR)
**Does your app use encryption?** Yes
**Is it exempt under EAR?** Yes — the app uses only standard HTTPS (TLS) and WebSocket Secure (WSS) for network communication, and Apple's built-in CryptoKit/Security framework for Sign in with Apple token handling. No custom or proprietary encryption. This qualifies for the exemption under Section 740.17(b)(1).

## Content Rights
**Does your app contain, display, or access third-party content?** Yes — trivia questions sourced from open databases (OpenTDB) and original content. All content is used with appropriate rights.

## Privacy
**Privacy Policy URL:** https://quizzup-ten.vercel.app/privacy

### Data collected:
| Data Type | Collected | Linked to Identity | Used for Tracking |
|-----------|-----------|-------------------|-------------------|
| Name (display name) | Yes | Yes | No |
| User ID (Firebase UID) | Yes | Yes | No |
| Game History | Yes | Yes | No |

### Data NOT collected:
- Location, contacts, health, financial, browsing history, search history, diagnostics, advertising data, photos, emails, messages, phone number.

## Age Rating
**Rating:** 4+ (no objectionable content, no gambling, no violence)

## Category
**Primary:** Games > Trivia
**Secondary:** Games > Word
