import apiClient from './apiClient.js';

export const postService = {
  /**
   * 1. GET ALL POSTS
   * Retrieves main feed posts along with likes, comments, and user-specific flags
   */
  async getAllPosts() {
    return await apiClient('/posts', {
      method: 'GET',
    });
  },

  /**
   * 2. CREATE POST (Supports Text & Optional File/Media Uploads)
   * @param {Object} postData - { content: string, campus: string, file: File | null }
   */
  async createPost({ content, campus, file }) {
    // If a file is attached, package request as FormData
    if (file) {
      const formData = new FormData();
      if (content) formData.append('content', content);
      if (campus) formData.append('campus', campus);
      formData.append('file', file); // Matches upload.single('file') in Express

      return await apiClient('/posts', {
        method: 'POST',
        body: formData, // Content-Type header auto-generated with multipart boundary
      });
    }

    // Standard JSON creation if no media attachment
    return await apiClient('/posts', {
      method: 'POST',
      body: JSON.stringify({ content, campus }),
    });
  },

  /**
   * 3. TOGGLE LIKE / UNLIKE
   * @param {number|string} postId
   */
  async toggleLike(postId) {
    return await apiClient(`/posts/${postId}/like`, {
      method: 'POST',
    });
  },

  /**
   * 4. ADD COMMENT
   * @param {number|string} postId
   * @param {string} commentText
   */
  async addComment(postId, commentText) {
    return await apiClient(`/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ comment: commentText }),
    });
  },

  async deleteComment(postId, commentId) {
    return await apiClient(`/posts/${postId}/comments/${commentId}`, {
      method: 'DELETE',
    });
  },

  async repost(postId) {
    return await apiClient(`/posts/${postId}/repost`, {
      method: 'POST',
    });
  },
};

export default postService;