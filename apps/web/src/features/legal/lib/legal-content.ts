export const LEGAL_EFFECTIVE_DATE = "June 10, 2026";
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
    "This policy explains what Sonder may process, why it is processed, and the choices available to people who use the service.",
  notice:
    "Important: Sonder is anonymous to other users, not necessarily anonymous to the service operator. Location, device, moderation, and uploaded-content data may identify or relate to a person.",
  sections: [
    {
      title: "Information Sonder may process",
      items: [
        "Content you submit, including titles, thoughts, photos, songs, reports, and the location attached to a post.",
        "Approximate or precise location when you choose a place, tap the map, or allow browser location access.",
        "Technical and security data such as IP address, browser type, device information, timestamps, and abuse-prevention identifiers.",
        "Moderation records, reports, decisions, and communications sent to the operator.",
      ],
    },
    {
      title: "Why the information is used",
      items: [
        "To display approved posts on the map and provide requested features.",
        "To review submissions, investigate reports, prevent spam, and protect users.",
        "To maintain, secure, debug, and improve the service.",
        "To comply with lawful requests and applicable legal obligations.",
      ],
    },
    {
      title: "Public content and location",
      paragraphs: [
        "Approved posts and their attached locations are public. Do not submit names, contact details, private conversations, faces without permission, home addresses, or information that could identify another person.",
        "Removing your browser data does not necessarily remove a public post. Use the published privacy contact to request access, correction, deletion, or review of content associated with you.",
      ],
    },
    {
      title: "Sharing and service providers",
      paragraphs: [
        "Information may be processed by hosting, database, map, moderation, analytics, storage, and music-search providers only as needed to operate the service. Sonder does not sell personal information.",
        "Information may also be preserved or disclosed when reasonably necessary to address abuse, protect rights and safety, or comply with valid legal process.",
      ],
    },
    {
      title: "Retention and security",
      paragraphs: [
        "Data should be retained only while needed for the purposes described above, moderation and security, dispute handling, or legal obligations. Published content may remain until removed, rejected, or deleted.",
        "Reasonable organizational, technical, and physical safeguards should be used, but no online service can promise absolute security.",
      ],
    },
    {
      title: "Your privacy rights",
      paragraphs: [
        "Depending on applicable law, you may have rights to be informed, access data, object to processing, correct inaccurate data, request deletion or blocking, withdraw consent where consent is the basis, and lodge a complaint with a privacy regulator.",
        `Send privacy requests to ${LEGAL_CONTACT}. Before public launch, the operator must ensure this address is active and publish the operator's legal identity and mailing address.`,
      ],
    },
    {
      title: "Children",
      paragraphs: [
        "Sonder is not intended for children under 13. Do not submit content about a minor that reveals sensitive, identifying, or precise-location information. The operator should verify and document the age threshold required in each launch jurisdiction.",
      ],
    },
    {
      title: "Changes",
      paragraphs: [
        "Material changes should be announced in the service, and the effective date should be updated. Continued use after a change means the updated policy applies where permitted by law.",
      ],
    },
  ],
};

export const termsOfUse: LegalDocument = {
  eyebrow: "Terms",
  title: "Terms of Use",
  summary:
    "These terms set the basic rules for using Sonder and submitting public anonymous content.",
  notice:
    "These terms are a launch-ready template, not legal advice. The operator must add its legal identity, jurisdiction, working contact details, and obtain local legal review before a public launch.",
  sections: [
    {
      title: "Using Sonder",
      paragraphs: [
        "You may use Sonder only if you can legally agree to these terms. You are responsible for your submissions and for complying with applicable law.",
        "Sonder may review, reject, hide, remove, preserve, or restrict content and access when reasonably necessary for safety, legal compliance, or service integrity.",
      ],
    },
    {
      title: "Your content",
      paragraphs: [
        "You keep ownership of content you create. By submitting content, you grant the operator a non-exclusive, worldwide, royalty-free license to host, store, reproduce, display, moderate, and share it only as needed to operate and promote Sonder.",
        "You must have the rights and permissions needed for every thought, photo, song link, and other material you submit. Do not upload copyrighted media you are not authorized to use.",
      ],
    },
    {
      title: "Prohibited use",
      items: [
        "Harassment, threats, stalking, hate, exploitation, or encouragement of violence or self-harm.",
        "Personal data, doxxing, private communications, or precise locations that endanger another person.",
        "Sexual content involving minors, non-consensual intimate content, or illegal content.",
        "Defamation, impersonation, fraud, spam, malware, automated abuse, or attempts to bypass moderation.",
        "Content that infringes copyright, privacy, publicity, or other rights.",
      ],
    },
    {
      title: "No emergency service",
      paragraphs: [
        "Sonder is not monitored continuously and is not an emergency or crisis service. Contact local emergency services when someone is in immediate danger.",
      ],
    },
    {
      title: "Service availability and liability",
      paragraphs: [
        "The service may change, pause, or end. To the extent permitted by law, it is provided without guarantees of uninterrupted availability, accuracy, or preservation of submissions.",
        "Nothing in these terms excludes rights or liabilities that cannot legally be excluded.",
      ],
    },
    {
      title: "Reports and disputes",
      paragraphs: [
        `Report unlawful or rights-infringing content to ${LEGAL_CONTACT} with the post link, reason, and enough information to evaluate the request. Do not include unnecessary personal information.`,
      ],
    },
  ],
};

export const communityGuidelines: LegalDocument = {
  eyebrow: "Community",
  title: "Community Guidelines",
  summary:
    "Sonder is public and anonymous. These rules keep the map reflective without making it unsafe.",
  sections: [
    {
      title: "Leave feelings, not identities",
      items: [
        "Write about your own experience without naming or identifying another person.",
        "Do not post phone numbers, social handles, private messages, faces without permission, or home and live locations.",
        "Choose a nearby public place instead of an exact location when precision could put someone at risk.",
      ],
    },
    {
      title: "Be lawful and humane",
      items: [
        "No harassment, threats, hate, humiliation, exploitation, or encouragement of harm.",
        "No illegal content, scams, spam, or instructions intended to facilitate wrongdoing.",
        "Only submit photos and other media you have permission to share.",
      ],
    },
    {
      title: "Moderation",
      paragraphs: [
        "Submissions may be reviewed before appearing publicly. Reports and moderation decisions consider context, safety, rights, and applicable law.",
        "Repeated or severe abuse may result in content removal, blocked access, evidence preservation, or referral to relevant authorities where legally required.",
      ],
    },
  ],
};

export const safetyPolicy: LegalDocument = {
  eyebrow: "Safety",
  title: "Safety and Reporting",
  summary:
    "How to protect yourself, protect others, and report content that should not be on Sonder.",
  sections: [
    {
      title: "Before posting",
      items: [
        "Remove names, faces, contact details, identifying stories, and private conversations.",
        "Avoid homes, shelters, clinics, schools, and other sensitive precise locations.",
        "Confirm you have permission to share every photo and media attachment.",
      ],
    },
    {
      title: "Report a post",
      paragraphs: [
        `Send the public post link and a short explanation to ${LEGAL_CONTACT}. For privacy, copyright, or legal requests, explain your relationship to the content and the action requested.`,
        "Do not send identity documents unless the operator specifically and securely requests them after reviewing the report.",
      ],
    },
    {
      title: "Immediate danger",
      paragraphs: [
        "Sonder is not an emergency service and reports may not be reviewed immediately. Contact local emergency services or an appropriate crisis service when there is immediate danger.",
      ],
    },
    {
      title: "Transparency",
      paragraphs: [
        "The operator should document moderation decisions, maintain a clear escalation process, respond to valid rights requests, and publish material policy changes.",
      ],
    },
  ],
};
