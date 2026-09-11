import { isPublicPost, getPostType, relativeTime, getLatestPost } from '../post-utils';
import type { AnonymousPost, PostDraft } from '../post-types';

describe('post-utils', () => {
  describe('isPublicPost', () => {
    it('returns true for approved posts without deletedAt', () => {
      expect(isPublicPost({ moderationStatus: 'approved' })).toBe(true);
    });

    it('returns true for flagged posts without deletedAt', () => {
      expect(isPublicPost({ moderationStatus: 'flagged' })).toBe(true);
    });

    it('returns false for pending or rejected posts', () => {
      expect(isPublicPost({ moderationStatus: 'pending' })).toBe(false);
      expect(isPublicPost({ moderationStatus: 'rejected' })).toBe(false);
    });

    it('returns false if post has deletedAt', () => {
      expect(isPublicPost({ moderationStatus: 'approved', deletedAt: '2026-01-01' })).toBe(false);
    });
  });

  describe('getPostType', () => {
    it('returns mixed if both image and music are present', () => {
      expect(getPostType({ imageUrl: 'img.jpg', music: {} } as PostDraft)).toBe('mixed');
    });

    it('returns photo if only image is present', () => {
      expect(getPostType({ imageUrl: 'img.jpg' } as PostDraft)).toBe('photo');
    });

    it('returns song if only music is present', () => {
      expect(getPostType({ music: {} } as PostDraft)).toBe('song');
    });

    it('returns text if neither are present', () => {
      expect(getPostType({ text: 'hello' } as PostDraft)).toBe('text');
    });
  });

  describe('relativeTime', () => {
    beforeAll(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-07-08T12:00:00Z'));
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    it('formats less than a minute ago', () => {
      expect(relativeTime(new Date('2026-07-08T11:59:30Z').toISOString())).toBe('just now');
    });

    it('formats minutes ago', () => {
      expect(relativeTime(new Date('2026-07-08T11:55:00Z').toISOString())).toBe('5m ago');
    });

    it('formats hours ago', () => {
      expect(relativeTime(new Date('2026-07-08T10:00:00Z').toISOString())).toBe('2h ago');
    });

    it('formats days ago', () => {
      expect(relativeTime(new Date('2026-07-06T12:00:00Z').toISOString())).toBe('2d ago');
    });
  });

  describe('getLatestPost', () => {
    const createMockPost = (id: string, title: string, createdAt: string): AnonymousPost => ({
      id,
      title,
      type: 'text',
      text: 'hello',
      lat: 0,
      lng: 0,
      createdAt,
      moderationStatus: 'approved',
    });

    it('returns undefined when array is empty or undefined', () => {
      expect(getLatestPost([])).toBeUndefined();
    });

    it('returns the only post when single post is provided', () => {
      const post = createMockPost('1', 'Only thought', '2026-01-01T00:00:00Z');
      expect(getLatestPost([post])).toBe(post);
    });

    it('returns the latest post among multiple posts', () => {
      const older = createMockPost('1', 'Older thought', '2026-01-01T00:00:00Z');
      const latest = createMockPost('2', 'Latest thought', '2026-01-02T12:00:00Z');
      const middle = createMockPost('3', 'Middle thought', '2026-01-01T15:00:00Z');

      expect(getLatestPost([older, latest, middle])).toBe(latest);
      expect(getLatestPost([latest, older, middle])).toBe(latest);
      expect(getLatestPost([older, middle, latest])).toBe(latest);
    });
  });
});
