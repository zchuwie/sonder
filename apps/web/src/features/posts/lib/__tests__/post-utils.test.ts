import { isPublicPost, getPostType, relativeTime } from '../post-utils';
import type { PostDraft } from '../post-types';

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
});
