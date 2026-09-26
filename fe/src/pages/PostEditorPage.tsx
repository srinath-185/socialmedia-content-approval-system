import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { postsApi, clientsApi } from '../api';
import { Post, Client, Platform } from '../types';
import { PostEditor } from '../components/posts/PostEditor';
import { PostPreview } from '../components/posts/PostPreview';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { ArrowLeft, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

export const PostEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [post, setPost] = useState<Post | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [previewPlatform, setPreviewPlatform] = useState<Platform>(Platform.INSTAGRAM);
  const [previewCaption, setPreviewCaption] = useState<string>('');
  const [previewBrand, setPreviewBrand] = useState<string>('');
  const [previewDate, setPreviewDate] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const clientList = await clientsApi.getAll();
        setClients(clientList);

        if (isEditing && id) {
          const postData = await postsApi.getOne(id);
          setPost(postData);
          setPreviewPlatform(postData.platform);
          setPreviewCaption(postData.caption);
          setPreviewBrand(postData.client?.brandName || 'Brand');
          setPreviewDate(postData.scheduledAt || undefined);
        } else if (clientList.length > 0) {
          setPreviewBrand(clientList[0].brandName);
        }
      } catch (err: any) {
        const msg = err.response?.data?.message || 'Failed to load post editor data';
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, [id, isEditing]);

  const handleClientChange = (clientId: string) => {
    const selected = clients.find((c) => c._id === clientId);
    if (selected) setPreviewBrand(selected.brandName);
  };

  const handleSubmit = async (formData: {
    client: string;
    platform: Platform;
    caption: string;
    scheduledAt?: string;
    version?: number;
  }) => {
    setIsSubmitting(true);
    try {
      if (isEditing && id && post) {
        const updated = await postsApi.update(id, {
          platform: formData.platform,
          caption: formData.caption,
          scheduledAt: formData.scheduledAt,
          version: post.version, // Optimistic locking
        });
        toast.success(`Post updated to version ${updated.version}!`);
        navigate(`/posts/${id}`);
      } else {
        const created = await postsApi.create({
          client: formData.client,
          platform: formData.platform,
          caption: formData.caption,
          scheduledAt: formData.scheduledAt,
        });
        toast.success('Post draft successfully created!');
        navigate(`/posts/${created._id}`);
      }
    } catch (err: any) {
      if (err.response?.status === 409) {
        toast.error(
          err.response?.data?.message ||
            'Optimistic locking conflict: Post has been modified by someone else. Please reload.',
          { duration: 6000 },
        );
      } else {
        toast.error(err.response?.data?.message || 'Failed to save post. Please review inputs.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading post editor..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        title="Post Editor Error"
        message={error}
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Breadcrumb & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition"
          title="Back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>{isEditing ? `Edit Post (v${post?.version})` : 'Create New Social Post'}</span>
            <Sparkles className="w-4 h-4 text-indigo-600" />
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Craft social media copy with live platform character counter and instant preview
          </p>
        </div>
      </div>

      {/* Editor & Preview Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Editor Form Left */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <PostEditor
            initialPost={post || undefined}
            clients={clients}
            onSubmit={handleSubmit}
            onCaptionChange={setPreviewCaption}
            onPlatformChange={setPreviewPlatform}
            onClientChange={handleClientChange}
            onDateChange={setPreviewDate}
            isSubmitting={isSubmitting}
          />
        </div>

        {/* Live Preview Right */}
        <div className="lg:col-span-5 sticky top-20">
          <PostPreview
            brandName={previewBrand}
            platform={previewPlatform}
            caption={previewCaption}
            scheduledAt={previewDate}
          />
        </div>
      </div>
    </div>
  );
};
