"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_TAG_COLOR = exports.REGEX_PATTERNS = exports.VALIDATION_LIMITS = void 0;
exports.VALIDATION_LIMITS = {
    USER_NAME_MIN: 2,
    USER_NAME_MAX: 100,
    PASSWORD_MIN: 6,
    PASSWORD_MAX: 100,
    EVENT_TITLE_MIN: 3,
    EVENT_TITLE_MAX: 255,
    EVENT_DESC_MIN: 10,
    EVENT_LOC_MIN: 2,
    EVENT_LOC_MAX: 255,
    TAG_NAME_MIN: 2,
    TAG_NAME_MAX: 50,
    TOTP_CODE_LENGTH: 6,
    MAX_BODY_LIMIT: '10mb',
};
exports.REGEX_PATTERNS = {
    HEX_COLOR: /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/,
};
exports.DEFAULT_TAG_COLOR = '#6366f1';
