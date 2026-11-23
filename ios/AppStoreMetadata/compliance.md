# App Store Compliance Answers

## Export Compliance (proposed answers; confirm before submission)
**Does your app use encryption?** Yes
**Exemption:** Confirm the applicable App Store Connect answers before submission. The app uses standard HTTPS (TLS), WebSocket Secure (WSS), and Apple CryptoKit/Security for authentication; no custom encryption is implemented in the app source. This inventory is not a legal classification.

## Content Rights
**Does your app contain, display, or access third-party content?** Yes — quiz content and imagery include third-party material. Confirm the relevant licenses, permissions and attribution before submission; this checklist does not establish those rights.

## Privacy
**Privacy Policy URL:** https://quizzup.io/privacy.html

### Data collected:
| Data Type | Collected | Linked to Identity | Used for Tracking |
|-----------|-----------|-------------------|-------------------|
| Name (display name) | Yes | Yes | No |
| Email Address | Yes | Yes | No |
| User ID (Firebase UID) | Yes | Yes | No |
| Game History | Yes | Yes | No |
| Messages (sender, recipient, content, timestamp) | Yes | Yes | No |
| Friends / in-app social graph | Yes | Yes | No |

Google Sign-In and Firebase Auth also declare device/account identifiers, approximate IP-based location, usage data and diagnostic data for authentication, fraud prevention and analytics. The versioned Google Sign-In manifest includes phone contact data. These SDK declarations are included in App Privacy, without advertising tracking.

### Data NOT collected:
- Precise device location, device address book, health, financial, browsing history, search history, advertising data. The app does not request device contacts or unrestricted photo-library access. Users can select a photo for a community post using the system photo picker; community photos, posts and comments are linked to their account and used for app functionality. Account profile images may also be displayed from an existing account. This release includes no advertising SDK or advertising tracking.

The privacy manifest also declares gameplay content, messages and the in-app social graph for app functionality, linked to the account and without tracking. These source declarations must be reconciled with the final App Store Connect privacy answers and third-party SDK privacy reports before submission.

## Age Rating
**Rating:** To be determined from the current App Store Connect questionnaire and the full quiz catalog. Do not assume a 4+ rating without reviewing the content.

## Category
**Primary:** Games > Trivia
**Secondary:** Games > Word
