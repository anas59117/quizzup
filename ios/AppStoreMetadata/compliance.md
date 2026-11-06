# App Store Compliance Answers

## Export Compliance (proposed answers; confirm before submission)
**Does your app use encryption?** Yes
**Exemption:** Confirm the applicable App Store Connect answers before submission. The app uses standard HTTPS (TLS), WebSocket Secure (WSS), and Apple CryptoKit/Security for authentication; no custom encryption is implemented in the app source. This inventory is not a legal classification.

## Content Rights
**Does your app contain, display, or access third-party content?** Yes — quiz content and imagery include third-party material. Confirm the relevant licenses, permissions and attribution before submission; this checklist does not establish those rights.

## Privacy
**Privacy Policy URL:** https://quizzup-ten.vercel.app/privacy.html

### Data collected:
| Data Type | Collected | Linked to Identity | Used for Tracking |
|-----------|-----------|-------------------|-------------------|
| Name (display name) | Yes | Yes | No |
| Email Address | Yes | Yes | No |
| User ID (Firebase UID) | Yes | Yes | No |
| Game History | Yes | Yes | No |
| Messages (sender, recipient, content, timestamp) | Yes | Yes | No |
| Friends / in-app social graph | Yes | Yes | No |

### Data NOT collected:
- Location, device address book, health, financial, browsing history, search history, advertising data, phone number. The app does not request the device's contacts or photo library. Account profile images may be displayed from an existing account; there is no native photo upload in this version.

The privacy manifest also declares gameplay content, messages and the in-app social graph for app functionality, linked to the account and without tracking. These source declarations must be reconciled with the final App Store Connect privacy answers and third-party SDK privacy reports before submission.

## Age Rating
**Rating:** To be determined from the current App Store Connect questionnaire and the full quiz catalog. Do not assume a 4+ rating without reviewing the content.

## Category
**Primary:** Games > Trivia
**Secondary:** Games > Word
