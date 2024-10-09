export const Constants = {
  ORDER_STATUS: {
    ACCEPTED: 'accepted',
    REJECTED: 'rejected',
    CANCELLED: 'cancelled',
    PREPARING: 'preparing',
    DELIVERED: 'delivered',
    OUT_FOR_DELIVERY: 'out_for_delivery',
    READY_FOR_PICKUP: 'ready_for_pickup',
  },

  COLLECTIONS: {
    USER: 'user',
    OTP: 'otp',
    PRODUCT: 'product',
    CATEGORIES: 'categories',
    SUB_CATEGORIES: 'sub_categories',
    ORDER: 'order',
    USER_WALLET: 'user_wallet',
    COMPANY: 'company',

    PAYMENT: 'payment',

    CART: 'cart',
    OFFERS: 'offers',
  },
  API_ERRORS: {
    JOB_MISSING: {
      title: 'job_not_found',
      detail:
        'Either job does not exists or you do not have access to view/update the job',
      code: 400,
    },
    APPLICATION_MISSING: {
      title: 'application_not_found',
      detail:
        'Either application does not exists or you do not have access to view/update the application',
      code: 400,
    },
    USER_MISSING: {
      title: 'user_not_found',
      detail:
        'Either user does not exists or you do not have access to view/update the user',
      code: 404,
    },
    JOB_INACTIVE_OR_COMPLETED: {
      title: 'job_inactive',
      detail: 'Either job is not active or already completed',
      code: 400,
    },
    USER_ALREADY_EXISTS: {
      title: 'user_exists',
      detail: 'User with this email or phone already exists',
      code: 422,
    },
    EDIT_JOB_NOT_ACTIVE_OR_DRAFT: {
      title: 'not_allowed',
      detail: 'Only active and draft jobs can be edited',
      code: 400,
    },
    EDIT_JOB_LESS_THAN_24_HRS: {
      title: 'job_inactive',
      detail: 'Either job is not active or already completed',
      code: 400,
    },
    INSUFFICIENT_PERMISSIONS: {
      title: 'permission_issues',
      detail:
        'Looks like you do not have permission to view this resource or take this action',
      code: 403,
    },
    SLOT_EDIT_NOT_ALLOWED_WRT_TIME: {
      title: 'not_allowed',
      detail:
        'You can only make changes to application at least 24 hours before start time',
      code: 400,
    },
    REJECT_LIST_EMPTY_SLOT_REDUCE: {
      title: 'bad_request',
      detail:
        "You're trying to reduce the number of slots to fewer than the already selected candidates. Number of candidates need to be rejected =",
      code: 400,
    },
    INTERNAL_ERROR: {
      title: 'internal_error',
      detail:
        'Oh No! something went wrong while processing your request, please try again and if the issue persists please reach out to our support team',
      code: 500,
    },
    START_SHIFT_BEFORE_REQUEST: {
      title: 'not_allowed',
      detail:
        'You can start a shift up to 1 hour or less before the start time of your job.',
      code: 400,
    },
    PRICE_REDUCTION_NOT_ALLOWED: {
      title: 'not_allowed',
      detail: 'You can not decrease price per hour for this job',
      code: 400,
    },
    BAD_REQUEST: {
      title: 'not_allowed',
      detail: '',
      code: 400,
    },
    CONVERSATION_START_RANGE_ERROR: {
      title: 'not_allowed',
      detail:
        'You can only start a conversation between 24 hours before the start time and the start time of the job.',
      code: 400,
    },
  },
} as const;
