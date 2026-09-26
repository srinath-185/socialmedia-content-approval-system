import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { postsApi, commentsApi, auditLogsApi } from '../api';
import { Post, Comment, AuditLog, PostStatus, Role } from '../types';
import { useAuth } from '../hooks/useAuth';
import { StatusBadge } from '../components/posts/StatusBadge';
import { PostPreview } from '../components/posts/PostPreview';
import { CommentThread } from '../components/posts/CommentThread';
import { AuditTimeline } from '../components/posts/AuditTimeline';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { formatToIST, toLocalDatetimeInput } from '../../src/utils/dateUtils';
import { PLATFORM_CONFIGS } from '../../src/utils/platformLimits';
import { getErrorMessage } from '../utils/errorMapper';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Edit,
  Send,
  CheckCircle,
  AlertTriangle,
  History,
  MessageSquare,
  Sparkles,
  Lock,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const PostDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [activeTab, setActiveTab] = useState<'comments' | 'audit'>('comments');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Modal Dialog States
  const [showChangesModal, setShowChangesModal] = useState<boolean>(false);
  const [changesComment, setChangesComment] = useState<string>('');

  const [showScheduleModal, setShowScheduleModal] = useState<boolean>(false);
  const [scheduleDatetime, setScheduleDatetime] = useState<string>('');

  const loadPostData = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);

    try {
      const [postData, commentsData, auditData] = await Promise.all([
        postsApi.getOne(id),
        commentsApi.getByPost(id),
        auditLogsApi.getByPost(id),
      ]);

      setPost(postData);
      setComments(commentsData);
      setAuditLogs(auditData);
      if (postData.scheduledAt) {
        setScheduleDatetime(toLocalDatetimeInput(postData.scheduledAt));
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to load post details';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadPostData();
  }, [loadPostData]);

  // Handle generic workflow status transition
  const handleTransition = async (
    toStatus: PostStatus,
    extraData?: { comment?: string; scheduledAt?: string },
  ) => {
    if (!post || !id) return;

    setIsActionLoading(true);
    try {
      const updated = await postsApi.transition(id, {
        toStatus,
        version: post.version, // Enforce optimistic concurrency control
        ...extraData,
      });

      toast.success(`Post status updated to ${toStatus.replace('_', ' ')}!`);
      setPost(updated);

      // Refresh comments and audit logs
      const [updatedComments, updatedAudit] = await Promise.all([
        commentsApi.getByPost(id),
        auditLogsApi.getByPost(id),
      ]);
      setComments(updatedComments);
      setAuditLogs(updatedAudit);

      setShowChangesModal(false);
      setShowScheduleModal(false);
      setChangesComment('');
    } catch (err: any) {
      const errorMsg = getErrorMessage(err.response);
      if (err.response?.status === 409) {
        toast.error(errorMsg, { duration: 7000 });
        if (err.response?.data?.errorCode === 'OPTIMISTIC_LOCK_CONFLICT') {
          loadPostData();
        }
      } else {
        toast.error(errorMsg);
      }
    } finally {
      setIsActionLoading(false);
    }
  };

  // Add Comment Handler
  const handleAddComment = async (message: string) => {
    if (!id) return;
    try {
      const newComment = await commentsApi.create(id, { message });
      setComments((prev) => [...prev, newComment]);
      toast.success('Comment added');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add comment');
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading post details and audit history..." />;
  }

  if (error || !post) {
    return (
      <ErrorMessage
        title="Post Not Found"
        message={error || 'The requested post could not be loaded.'}
        onRetry={loadPostData}
      />
    );
  }

  // Permission Checks
  const isCreatorOfPost = user?.userId === post.createdBy?._id;
  const isCreator = user?.role === Role.CREATOR;
  const isReviewer = user?.role === Role.REVIEWER;
  const isAdmin = user?.role === Role.ADMIN;

  const canEdit =
    isCreatorOfPost &&
    (post.status === PostStatus.DRAFT || post.status === PostStatus.CHANGES_REQUESTED);

  const canSubmitForReview =
    (isCreatorOfPost || isAdmin) &&
    (post.status === PostStatus.DRAFT || post.status === PostStatus.CHANGES_REQUESTED);

  // Reviewer can only approve/reject if not own post (no self-approval)
  const canReview =
    (isReviewer || isAdmin) &&
    post.status === PostStatus.IN_REVIEW &&
    !isCreatorOfPost; // Self-approval block on UI

  const canSchedule =
    (isAdmin || isCreatorOfPost || isReviewer) && post.status === PostStatus.APPROVED;

  const platformConfig = PLATFORM_CONFIGS[post.platform];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition"
            title="Back to board"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-slate-900">
                {post.client?.brandName}
              </span>
              <span className="text-slate-300">•</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${platformConfig.badgeColor}`}
              >
                {platformConfig.label}
              </span>
              <span className="text-xs font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                v{post.version}
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              Created by {post.createdBy?.name || 'Creator'} • ID: {post._id}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <StatusBadge status={post.status} size="md" />
        </div>
      </div>

      {/* Action Workflow Banner */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span>
            Current Workflow Stage:{' '}
            <strong className="text-slate-900">{post.status.replace('_', ' ')}</strong>
          </span>
          {isCreatorOfPost && post.status === PostStatus.IN_REVIEW && (
            <span className="text-amber-600 flex items-center gap-1 ml-2 text-[11px]">
              <Lock className="w-3 h-3" /> Under reviewer evaluation (Self-approval blocked)
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {canEdit && (
            <button
              onClick={() => navigate(`/posts/${post._id}/edit`)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit Caption</span>
            </button>
          )}

          {canSubmitForReview && (
            <button
              onClick={() => handleTransition(PostStatus.IN_REVIEW)}
              disabled={isActionLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold text-white shadow-xs transition disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit for Review</span>
            </button>
          )}

          {canReview && (
            <>
              <button
                onClick={() => setShowChangesModal(true)}
                disabled={isActionLoading}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-xs font-semibold text-amber-800 transition disabled:opacity-50"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Request Changes</span>
              </button>

              <button
                onClick={() => handleTransition(PostStatus.APPROVED)}
                disabled={isActionLoading}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white shadow-xs transition disabled:opacity-50"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Approve Post</span>
              </button>
            </>
          )}

          {canSchedule && (
            <button
              onClick={() => setShowScheduleModal(true)}
              disabled={isActionLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-xs font-semibold text-white shadow-xs transition disabled:opacity-50"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Schedule Post</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Post Info & Mockup Left, Timeline/Comments Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 cols): Post details and feed preview */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Post Content & Copy
            </h3>

            <div className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed bg-slate-50/70 p-4 rounded-xl border border-slate-100">
              {post.caption}
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Scheduled Time (IST)</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                  {formatToIST(post.scheduledAt)}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Author</span>
                <span className="font-semibold text-slate-800 mt-0.5 block">
                  {post.createdBy?.name} ({post.createdBy?.email})
                </span>
              </div>
            </div>
          </div>

          {/* Social Media Feed Preview */}
          <PostPreview
            brandName={post.client?.brandName}
            platform={post.platform}
            caption={post.caption}
            scheduledAt={post.scheduledAt || undefined}
          />
        </div>

        {/* Right Column (5 cols): Activity Tabs (Comments vs Audit Timeline) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-2xs p-5">
          {/* Tab Navigation */}
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
            <button
              onClick={() => setActiveTab('comments')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'comments'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Comments ({comments.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'audit'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Audit Trail ({auditLogs.length})</span>
            </button>
          </div>

          {/* Tab Panes */}
          {activeTab === 'comments' ? (
            <CommentThread
              comments={comments}
              onAddComment={handleAddComment}
              isLoading={isActionLoading}
            />
          ) : (
            <AuditTimeline logs={auditLogs} />
          )}
        </div>
      </div>

      {/* Modal: Request Changes (requires comment >= 10 chars) */}
      {showChangesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100">
            <div className="flex items-center gap-2 text-amber-800 font-bold text-base mb-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <span>Request Revisions</span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Explain why this post requires revisions. A comment of at least 10 characters is
              mandatory.
            </p>

            <textarea
              rows={4}
              value={changesComment}
              onChange={(e) => setChangesComment(e.target.value)}
              placeholder="Provide specific feedback on copy, brand tone, or hashtags (min 10 characters)..."
              className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500 transition"
            />

            <div className="flex items-center justify-between mt-2 mb-4 text-[11px]">
              <span
                className={
                  changesComment.trim().length >= 10 ? 'text-emerald-600 font-semibold' : 'text-slate-400'
                }
              >
                {changesComment.trim().length} / 10 min chars
              </span>
            </div>

            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowChangesModal(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={changesComment.trim().length < 10 || isActionLoading}
                onClick={() =>
                  handleTransition(PostStatus.CHANGES_REQUESTED, { comment: changesComment.trim() })
                }
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition disabled:opacity-50"
              >
                Submit Revisions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Schedule Post (Future check + 2h Conflict Detection) */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100">
            <div className="flex items-center gap-2 text-purple-900 font-bold text-base mb-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              <span>Schedule Post Publication</span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Select target publication time in IST. The system validates that no other post for{' '}
              <strong>{post.client?.brandName}</strong> on <strong>{post.platform}</strong> is
              scheduled within 2 hours.
            </p>

            <div className="space-y-2 mb-5">
              <label className="block text-xs font-semibold text-slate-700">
                Scheduled Time (IST)
              </label>
              <input
                type="datetime-local"
                value={scheduleDatetime}
                onChange={(e) => setScheduleDatetime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-600 transition"
              />
              <span className="text-[11px] text-slate-400 block">
                Must be set to a future date and time.
              </span>
            </div>

            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowScheduleModal(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!scheduleDatetime || isActionLoading}
                onClick={() => {
                  const isoDate = new Date(scheduleDatetime).toISOString();
                  handleTransition(PostStatus.SCHEDULED, { scheduledAt: isoDate });
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white transition disabled:opacity-50"
              >
                Confirm Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
