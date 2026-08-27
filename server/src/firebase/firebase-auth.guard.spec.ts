import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { FirebaseAdminService } from './firebase-admin.service';
import { FirebaseAuthGuard } from './firebase-auth.guard';

function mockContext(headers: Record<string, string | undefined>) {
  const request = {
    header: (name: string) => headers[name.toLowerCase()],
  };
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
}

describe('FirebaseAuthGuard', () => {
  let verifyIdToken: jest.Mock;
  let firebaseAdmin: FirebaseAdminService;
  let guard: FirebaseAuthGuard;

  beforeEach(() => {
    verifyIdToken = jest.fn();
    firebaseAdmin = {
      auth: { verifyIdToken },
    } as unknown as FirebaseAdminService;
    guard = new FirebaseAuthGuard(firebaseAdmin);
  });

  it('rejects requests with no Authorization header', async () => {
    const ctx = mockContext({});
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(verifyIdToken).not.toHaveBeenCalled();
  });

  it('rejects requests with a malformed Authorization header (no Bearer prefix)', async () => {
    const ctx = mockContext({ authorization: 'garbage-token' });
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(verifyIdToken).not.toHaveBeenCalled();
  });

  it('rejects requests when verifyIdToken throws (invalid/expired token)', async () => {
    verifyIdToken.mockRejectedValue(new Error('invalid token'));
    const ctx = mockContext({ authorization: 'Bearer bad-token' });
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(verifyIdToken).toHaveBeenCalledWith('bad-token');
  });

  it('allows the request and attaches user info on a valid token', async () => {
    verifyIdToken.mockResolvedValue({
      uid: 'uid-123',
      email: 'user@example.com',
      name: 'Jane Doe',
      picture: 'https://example.com/photo.jpg',
    });

    const request: any = {
      header: (name: string) =>
        name.toLowerCase() === 'authorization'
          ? 'Bearer good-token'
          : undefined,
    };
    const ctx = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;

    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
    expect(verifyIdToken).toHaveBeenCalledWith('good-token');
    expect(request.user).toEqual({
      uid: 'uid-123',
      email: 'user@example.com',
      displayName: 'Jane Doe',
      photoURL: 'https://example.com/photo.jpg',
    });
  });

  it('defaults optional profile fields to null when absent from the token', async () => {
    verifyIdToken.mockResolvedValue({ uid: 'uid-456' });

    const request: any = {
      header: (name: string) =>
        name.toLowerCase() === 'authorization' ? 'Bearer token-2' : undefined,
    };
    const ctx = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;

    await guard.canActivate(ctx);

    expect(request.user).toEqual({
      uid: 'uid-456',
      email: null,
      displayName: null,
      photoURL: null,
    });
  });
});
