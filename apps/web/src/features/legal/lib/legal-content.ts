export const LEGAL_EFFECTIVE_DATE = "June 15, 2026";
export const LEGAL_CONTACT = "privacy@sonder.app";

export type LegalSection = {
  title: string;
  paragraphs?: string[];
  items?: string[];
};

export type LegalDocument = {
  eyebrow: string;
  title: string;
  summary: string;
  notice?: string;
  sections: LegalSection[];
};

export const privacyPolicy: LegalDocument = {
  eyebrow: "Privacy",
  title: "Privacy Policy",
  summary:
    "How Sonder processes content, location pins, technical identifiers, and safety records.",
  notice:
    "Sonder is publicly anonymous, not technically untraceable. Other users do not see a profile name with your post, but technical identifiers may be processed for safety and abuse prevention.",
  sections: [
    {
      title: "What Sonder is",
      paragraphs: [
        "Sonder is a place-based service for submitting thoughts, photos, and music metadata for review. Approved posts may appear publicly on the map with their selected location.",
      ],
    },
    {
      title: "Publicly anonymous posting",
      paragraphs: [
        "Sonder does not display your public profile name with a post. However, anonymous Supabase session IDs, hashed IP-related identifiers, timestamps, upload records, reports, and moderation logs may be processed to operate and protect the service.",
        "Do not use publicly anonymous posting to expose, threaten, impersonate, or harm another person.",
      ],
    },
    {
      title: "Information you submit",
      items: [
        "Post titles, thoughts, selected location pins, reports, and optional report details.",
        "Uploaded photos and related upload records, such as file type, size, storage path, status, and expiry time.",
        "Selected music metadata, including track title, artist, album, provider ID, cover, preview, and external links.",
      ],
    },
    {
      title: "Location pins",
      paragraphs: [
        "A selected location may become public if a post is approved. Browser location is used only when you choose to provide it, but precise pins can reveal sensitive information. Use a nearby public place instead of a home, shelter, clinic, school, or live location.",
      ],
    },
    {
      title: "Photos and temporary uploads",
      paragraphs: [
        "Photos may contain faces, addresses, IDs, or other identifying details. Only upload photos you have the right to share and remove private information before submission.",
        "Uploads are stored privately. Unattached temporary uploads are tracked so expired files can be removed. Approved post images are displayed using time-limited signed links rather than a publicly browsable storage bucket.",
      ],
    },
    {
      title: "Anonymous sessions and abuse prevention",
      paragraphs: [
        "Sonder uses anonymous authentication to associate submissions and pending posts with a session without displaying a public identity.",
        "Hashed IP-related identifiers and rate-limit records may be processed using a secret salt to reduce spam and abuse. Raw IP addresses may still be processed transiently by infrastructure and service providers.",
      ],
    },
    {
      title: "Reports and moderation logs",
      paragraphs: [
        "Reports, moderation decisions, reasons, timestamps, and moderator identifiers may be retained to investigate harm, enforce rules, handle disputes, and improve platform safety.",
      ],
    },
    {
      title: "Third-party services",
      items: [
        "Supabase provides authentication, database, private storage, and Edge Functions.",
        "Upstash Redis supports rate limiting and abuse prevention.",
        "Deezer provides music search, cover, and preview metadata.",
        "OpenFreeMap, MapLibre, Photon, and Nominatim support map display and place search.",
        "A hosting provider such as Vercel may process requests, logs, and technical data when used for deployment.",
      ],
    },
    {
      title: "Retention and security",
      paragraphs: [
        "Data is retained only as long as reasonably needed for service operation, moderation, abuse prevention, disputes, or legal obligations. Exact retention periods must be finalized before launch.",
        "Sonder uses access controls, row-level security, private storage, signed links, validation, moderation, and rate limits. No online service can guarantee absolute security.",
      ],
    },
    {
      title: "Your rights and requests",
      paragraphs: [
        "Depending on applicable law, you may request information, correction, deletion, restriction, or review. Anonymous sessions can make it difficult to verify that a requester submitted a specific post.",
        `Send privacy, removal, or rights requests to ${LEGAL_CONTACT}. This address and the operator's legal identity must be confirmed before public launch.`,
      ],
    },
    {
      title: "Children and policy changes",
      paragraphs: [
        "Sonder is not intended for children under 13. Never post identifying or precise-location information about a minor.",
        "Material policy changes should be announced and this effective date updated.",
      ],
    },
  ],
};

export const termsOfUse: LegalDocument = {
  eyebrow: "Terms",
  title: "Terms of Use",
  summary: "Rules for using Sonder and submitting publicly anonymous content.",
  notice:
    "These terms are an MVP draft, not legal advice. Operator identity, governing law, contact details, and launch jurisdictions require qualified legal review.",
  sections: [
    {
      title: "Acceptance and service",
      paragraphs: [
        "By using Sonder, you agree to these terms and applicable law. Sonder provides a moderated place-based platform where submissions may be reviewed before becoming public.",
      ],
    },
    {
      title: "Public content warning",
      paragraphs: [
        "If your post is approved, its text, selected location, attached photo, and selected music metadata may become publicly visible and shareable.",
        "You are responsible for the content you submit. Publicly anonymous does not remove that responsibility.",
      ],
    },
    {
      title: "Prohibited content and conduct",
      items: [
        "Harassment, bullying, stalking, threats, graphic violence, hate, or discriminatory content.",
        "Doxxing, personal information, private communications, unsafe precise locations, or content intended to identify another person.",
        "Sexual exploitation, non-consensual intimate content, or sexual content involving minors.",
        "Illegal activity, defamation, impersonation, scams, spam, malware, or automated abuse.",
        "Encouragement of violence, self-harm, or other serious harm.",
        "Copyright-infringing photos, music, or other content you do not have permission to share.",
      ],
    },
    {
      title: "Location, photo, and music rules",
      items: [
        "Avoid homes, live locations, shelters, clinics, schools, or other sensitive places when a pin could create risk.",
        "Only upload safe, appropriate photos you have the right to share. Avoid faces, IDs, addresses, and private information.",
        "Music attachments must use supported provider metadata. Do not use track titles, covers, or links to harass, impersonate, or mislead.",
      ],
    },
    {
      title: "Moderation and reports",
      paragraphs: [
        "We may review, reject, hide, remove, preserve, or report content when necessary to protect users, comply with laws, investigate reports, or prevent abuse.",
        "Reports must be made honestly. Repeated or abusive reporting may be rate-limited or restricted.",
      ],
    },
    {
      title: "Rate limits and restrictions",
      paragraphs: [
        "Sonder may limit submissions, uploads, reports, or access using anonymous session and hashed IP-related identifiers. Attempts to bypass moderation, validation, or rate limits are prohibited.",
      ],
    },
    {
      title: "Your content license",
      paragraphs: [
        "You keep ownership of your content. By submitting it, you grant the operator a non-exclusive, worldwide, royalty-free license to host, store, reproduce, display, moderate, and share it as needed to operate, secure, and promote Sonder.",
      ],
    },
    {
      title: "No emergency use",
      paragraphs: [
        "Sonder is not continuously monitored and is not an emergency or crisis service. Contact local emergency services when someone is in immediate danger.",
      ],
    },
    {
      title: "Availability, disclaimer, and liability",
      paragraphs: [
        "Sonder may change, pause, restrict, or end features or access. To the extent permitted by law, the service is provided without guarantees of uninterrupted availability, accuracy, or preservation of submissions.",
        "Nothing in these terms excludes rights or liabilities that cannot legally be excluded.",
      ],
    },
    {
      title: "Governing law and contact",
      paragraphs: [
        "Governing law and dispute procedures must be added after the operator selects launch jurisdictions and receives legal review.",
        `Questions, reports, and rights requests may be sent to ${LEGAL_CONTACT}. This contact must be active before launch.`,
      ],
    },
  ],
};

export const communityGuidelines: LegalDocument = {
  eyebrow: "Community",
  title: "Community Guidelines",
  summary:
    "Sonder is for leaving thoughts, not hurting people. Share memories and feelings without exposing someone else's private life.",
  sections: [
    {
      title: "Be kind",
      items: [
        "Share your own experience without humiliating, bullying, or targeting another person.",
        "Do not threaten, encourage harm, or use anonymity as cover for cruelty.",
      ],
    },
    {
      title: "Do not expose private information",
      items: [
        "Leave out names, phone numbers, social handles, private messages, IDs, addresses, and identifying details.",
        "Do not post faces or private conversations without permission.",
      ],
    },
    {
      title: "Be careful with locations",
      items: [
        "Choose a nearby public place when an exact pin could put someone at risk.",
        "Avoid live locations, homes, shelters, clinics, schools, and places connected to vulnerable people.",
      ],
    },
    {
      title: "Only share safe photos and music",
      items: [
        "Upload only photos you have the right to share. Check backgrounds for faces, IDs, addresses, and private information.",
        "Use music attachments to add feeling, not to harass, impersonate, mislead, or share unsupported content.",
      ],
    },
    {
      title: "Do not post illegal or harmful content",
      items: [
        "No hate, exploitation, sexual content involving minors, scams, malware, graphic violence, or instructions for wrongdoing.",
        "No encouragement of self-harm, violence, or serious harm.",
      ],
    },
    {
      title: "Report harm honestly",
      paragraphs: [
        "Report posts that expose private information, threaten people, harass others, promote hate, exploit someone, or otherwise create a safety concern.",
        "Reports help keep Sonder safe. Abuse of the reporting system may be limited.",
      ],
    },
    {
      title: "Posts are moderated",
      paragraphs: [
        "Posts wait for review before public visibility. Approval is not a guarantee that content is accurate or harmless. Public posts may later be archived or removed after review or reports.",
      ],
    },
  ],
};

export const safetyPolicy: LegalDocument = {
  eyebrow: "Safety",
  title: "Safety and Reporting",
  summary:
    "Practical guidance for posting carefully and reporting content that should not be on Sonder.",
  sections: [
    {
      title: "Before posting",
      items: [
        "Remove names, faces, contact details, addresses, identifying stories, and private conversations.",
        "Use a nearby public pin when precise location could create risk.",
        "Confirm you have permission to share every photo and attachment.",
      ],
    },
    {
      title: "Report a post",
      paragraphs: [
        "Use the report action on a public post and choose the closest safety reason. Reports are stored privately for moderation review.",
        `For privacy, copyright, removal, or legal requests, send the public post link and a short explanation to ${LEGAL_CONTACT}. Do not send unnecessary personal information.`,
      ],
    },
    {
      title: "What happens after a report",
      paragraphs: [
        "A report does not automatically remove a post. Moderators may review the post text, location, photo, music metadata, report reason, and relevant safety context before deciding what action to take.",
        "Repeated reports from the same session are prevented or rate-limited to reduce abuse.",
      ],
    },
    {
      title: "Immediate danger",
      paragraphs: [
        "Sonder is not continuously monitored and is not an emergency service. Contact local emergency services or an appropriate crisis service when there is immediate danger.",
      ],
    },
  ],
};
