import { describe, it, expect, jest } from '@jest/globals'
import { notifyUser } from '../notifications'

describe('notifyUser', () => {
  it('calls insert with correct defaults', async () => {
    const insertMock = jest.fn().mockResolvedValue({ error: null })
    const supabase: any = {
      from: jest.fn().mockReturnValue({
        insert: insertMock,
      }),
    }

    await notifyUser(supabase, {
      userId: 'user123',
      title: 'Test Title',
      message: 'Test Message',
    })

    expect(supabase.from).toHaveBeenCalledWith('notifications')
    expect(insertMock).toHaveBeenCalledWith({
      user_id: 'user123',
      title: 'Test Title',
      message: 'Test Message',
      type: 'case',
      related_id: null,
    })
  })

  it('calls insert with provided type and relatedId', async () => {
    const insertMock = jest.fn().mockResolvedValue({ error: null })
    const supabase: any = {
      from: jest.fn().mockReturnValue({
        insert: insertMock,
      }),
    }

    await notifyUser(supabase, {
      userId: 'user123',
      title: 'Test Title',
      message: 'Test Message',
      type: 'task',
      relatedId: 'task123',
    })

    expect(supabase.from).toHaveBeenCalledWith('notifications')
    expect(insertMock).toHaveBeenCalledWith({
      user_id: 'user123',
      title: 'Test Title',
      message: 'Test Message',
      type: 'task',
      related_id: 'task123',
    })
  })

  it('swallows errors without throwing', async () => {
    const insertMock = jest.fn().mockRejectedValue(new Error('DB Error'))
    const supabase: any = {
      from: jest.fn().mockReturnValue({
        insert: insertMock,
      }),
    }

    // This should not throw
    await expect(
      notifyUser(supabase, {
        userId: 'user123',
        title: 'Test Title',
        message: 'Test Message',
      })
    ).resolves.toBeUndefined()
  })
})
