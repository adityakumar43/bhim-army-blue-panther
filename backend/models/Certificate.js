import mongoose from 'mongoose'
import crypto from 'crypto'

// Appointment letters, certificates and general letters issued by the organisation.
// Each one has a reference number (like BBP/APT/2026/0001) and a secret link anyone can open to check it is real.
export const CERT_TYPES = ['appointment', 'appreciation', 'participation', 'letter']
export const TYPE_CODE = { appointment: 'APT', appreciation: 'APR', participation: 'PRT', letter: 'LTR' }
export const RELATIONS = ['', 'S/o', 'D/o', 'W/o']

const certificateSchema = new mongoose.Schema(
    {
        refNo: { type: String, unique: true },
        token: { type: String, unique: true, default: () => crypto.randomBytes(16).toString('hex') },
        type: { type: String, enum: CERT_TYPES, required: true },

        name: { type: String, required: true, trim: true, maxlength: 100 },
        relation: { type: String, enum: RELATIONS, default: '' }, // S/o = son of, D/o = daughter of, W/o = wife of
        guardian: { type: String, trim: true, maxlength: 100 }, // father's or husband's name
        phone: { type: String, trim: true, maxlength: 15 },
        email: { type: String, trim: true, lowercase: true, maxlength: 120 },
        district: { type: String, trim: true, maxlength: 100 },
        stateCode: { type: String, index: true },
        state: { type: String, trim: true, maxlength: 100 },

        post: { type: String, trim: true, maxlength: 120 }, // appointment: like "जिला अध्यक्ष / District President"
        area: { type: String, trim: true, maxlength: 120 }, // appointment: like "मेरठ जिला"
        reason: { type: String, trim: true, maxlength: 300 }, // certificates: what it is for
        issueDate: { type: Date, required: true },
        validUntil: Date, // appointment letters only

        signatoryName: { type: String, trim: true, maxlength: 100 },
        signatoryTitle: { type: String, trim: true, maxlength: 150 }, // can be two lines, like "प्रदेश अध्यक्ष\nमध्यप्रदेश"
        signatureUrl: { type: String, trim: true, maxlength: 500 }, // picture of the signature (uploaded in the form)

        // Appointment letter layout, copied from the last letter of the same state when a new one is made
        address: { type: String, trim: true, maxlength: 300 }, // पता of the person appointed
        showPhone: { type: Boolean, default: true }, // print their mobile number on the letter
        letterhead: {
            leaders: [{ _id: false, name: String, title: String, phone: String }], // the three names in the blue band
            office: String, // office address in the second band
        },
        preamble: { type: String, trim: true, maxlength: 2000 }, // opening paragraph
        closing: { type: String, trim: true, maxlength: 1000 }, // closing paragraph
        copies: { type: String, trim: true, maxlength: 1000 }, // प्रति लिपि, one per line

        // General letter (पत्र): written freely, like a request or invitation letter
        to: { type: String, trim: true, maxlength: 500 }, // सेवा में: the address block, several lines
        subject: { type: String, trim: true, maxlength: 300 }, // विषय (optional)
        salutation: { type: String, trim: true, maxlength: 60 }, // like "महोदय,"
        body: { type: String, trim: true, maxlength: 6000 }, // the letter itself, blank line = new paragraph
        signOff: { type: String, trim: true, maxlength: 60 }, // like "आपका" or "भवदीय"

        status: { type: String, enum: ['active', 'revoked'], default: 'active' },
        revokedAt: Date,
        revokeReason: { type: String, trim: true, maxlength: 200 },
        emailedAt: Date,
        issuedById: mongoose.Schema.Types.ObjectId,
        issuedByName: String,
    },
    { timestamps: true }
)

export default mongoose.model('Certificate', certificateSchema)