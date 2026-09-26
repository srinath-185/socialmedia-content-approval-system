export const getErrorMessage = (errorResponse: any): string => {
  if (!errorResponse) return 'An unexpected error occurred. Please try again.';

  const data = errorResponse.data || errorResponse;
  const errorCode = data.errorCode;
  const message = data.message;
  const details = data.details || {};

  switch (errorCode) {
    case 'SCHEDULING_CONFLICT_2HR':
      const id = details.conflictingPostId ? `#${details.conflictingPostId.slice(-6)}` : '';
      return `Scheduling Conflict: Another post for this client & platform is scheduled within 2 hours ${id}.`;

    case 'OPTIMISTIC_LOCK_CONFLICT':
      return 'Post was modified by another user. Reloading the latest version...';

    case 'SELF_APPROVAL_FORBIDDEN':
      return 'Action Forbidden: You cannot approve your own post.';

    case 'REVIEWER_NOT_ASSIGNED_TO_CLIENT':
      return 'Permission Denied: You are not assigned as a reviewer for this client.';

    case 'CREATOR_EDIT_FORBIDDEN':
      return 'Permission Denied: Only the creator who made this post can edit it.';

    case 'POST_STATUS_NOT_EDITABLE':
      return 'Posts can only be edited in DRAFT or CHANGES_REQUESTED status.';

    case 'CHANGES_REQUEST_COMMENT_REQUIRED':
      return 'Revisions require feedback comment of at least 10 characters.';

    case 'CAPTION_LIMIT_EXCEEDED':
      return message || 'Caption exceeds the platform maximum character limit.';

    case 'SCHEDULED_TIME_NOT_FUTURE':
      return 'The scheduled time must be in the future.';

    case 'INVALID_STATUS_TRANSITION':
      return message || 'This status transition is not permitted.';

    case 'AUTH_INVALID_CREDENTIALS':
      return 'Invalid email or password.';

    default:
      if (Array.isArray(message)) {
        return message.join(', ');
      }
      return message || 'An error occurred processing your request.';
  }
};
