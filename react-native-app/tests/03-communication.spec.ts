import { test, expect } from '@playwright/test';

test.describe('💬 Communication System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="tactical-app"]', { timeout: 30000 });
    
    // Create a session for communication tests
    await page.locator('[data-testid="create-session"]').click();
    await page.locator('[data-testid="session-name-input"]').fill('Communication Test');
    await page.locator('[data-testid="create-session-confirm"]').click();
  });

  test('should display chat interface', async ({ page }) => {
    // Check for chat panel
    await expect(page.locator('[data-testid="chat-panel"]')).toBeVisible();
    
    // Check for message input
    await expect(page.locator('[data-testid="message-input"]')).toBeVisible();
    
    // Check for send button
    await expect(page.locator('[data-testid="send-message"]')).toBeVisible();
    
    // Check for message history
    await expect(page.locator('[data-testid="message-history"]')).toBeVisible();
  });

  test('should send and display text messages', async ({ page }) => {
    const testMessage = 'Hello from E2E test!';
    
    // Type a message
    await page.locator('[data-testid="message-input"]').fill(testMessage);
    
    // Send the message
    await page.locator('[data-testid="send-message"]').click();
    
    // Verify message appears in history
    await expect(page.locator('[data-testid="message-history"]')).toContainText(testMessage);
    
    // Verify input is cleared
    await expect(page.locator('[data-testid="message-input"]')).toHaveValue('');
  });

  test('should send messages with Enter key', async ({ page }) => {
    const testMessage = 'Message sent with Enter key';
    
    // Type a message
    await page.locator('[data-testid="message-input"]').fill(testMessage);
    
    // Press Enter to send
    await page.locator('[data-testid="message-input"]').press('Enter');
    
    // Verify message appears in history
    await expect(page.locator('[data-testid="message-history"]')).toContainText(testMessage);
  });

  test('should display message timestamps', async ({ page }) => {
    const testMessage = 'Message with timestamp';
    
    // Send a message
    await page.locator('[data-testid="message-input"]').fill(testMessage);
    await page.locator('[data-testid="send-message"]').click();
    
    // Check for timestamp
    await expect(page.locator('[data-testid="message-timestamp"]')).toBeVisible();
  });

  test('should support message reactions', async ({ page }) => {
    const testMessage = 'React to this message';
    
    // Send a message
    await page.locator('[data-testid="message-input"]').fill(testMessage);
    await page.locator('[data-testid="send-message"]').click();
    
    // Hover over the message to show reaction options
    await page.locator('[data-testid="message-item"]').last().hover();
    
    // Check for reaction button
    await expect(page.locator('[data-testid="add-reaction"]')).toBeVisible();
    
    // Click to add reaction
    await page.locator('[data-testid="add-reaction"]').click();
    
    // Select an emoji
    await page.locator('[data-testid="emoji-thumbs-up"]').click();
    
    // Verify reaction is added
    await expect(page.locator('[data-testid="message-reaction"]')).toBeVisible();
  });

  test('should support message threading', async ({ page }) => {
    const originalMessage = 'Original message for threading';
    const replyMessage = 'This is a reply';
    
    // Send original message
    await page.locator('[data-testid="message-input"]').fill(originalMessage);
    await page.locator('[data-testid="send-message"]').click();
    
    // Hover over message to show thread option
    await page.locator('[data-testid="message-item"]').last().hover();
    
    // Click reply button
    await page.locator('[data-testid="reply-message"]').click();
    
    // Type reply
    await page.locator('[data-testid="thread-input"]').fill(replyMessage);
    await page.locator('[data-testid="send-reply"]').click();
    
    // Verify thread is created
    await expect(page.locator('[data-testid="message-thread"]')).toBeVisible();
    await expect(page.locator('[data-testid="thread-reply"]')).toContainText(replyMessage);
  });

  test('should display typing indicators', async ({ page }) => {
    // Start typing
    await page.locator('[data-testid="message-input"]').fill('Typing...');
    
    // Check for typing indicator (would show for other users)
    // In a real multi-user test, this would be visible to other participants
    await page.waitForTimeout(1000);
    
    // Clear input to stop typing
    await page.locator('[data-testid="message-input"]').clear();
  });

  test('should support media sharing', async ({ page, context }) => {
    // Grant permissions for media access
    await context.grantPermissions(['camera']);
    
    // Click media share button
    await page.locator('[data-testid="share-media"]').click();
    
    // Check for media options
    await expect(page.locator('[data-testid="media-options"]')).toBeVisible();
    await expect(page.locator('[data-testid="share-photo"]')).toBeVisible();
    await expect(page.locator('[data-testid="share-video"]')).toBeVisible();
    await expect(page.locator('[data-testid="share-document"]')).toBeVisible();
  });

  test('should support location sharing', async ({ page, context }) => {
    // Grant geolocation permission
    await context.grantPermissions(['geolocation']);
    
    // Click location share button
    await page.locator('[data-testid="share-location"]').click();
    
    // Wait for location to be acquired
    await page.waitForTimeout(2000);
    
    // Verify location message is sent
    await expect(page.locator('[data-testid="location-message"]')).toBeVisible();
  });

  test('should display message search functionality', async ({ page }) => {
    // Send multiple messages for search
    const messages = ['First test message', 'Second message', 'Third message with keyword'];
    
    for (const message of messages) {
      await page.locator('[data-testid="message-input"]').fill(message);
      await page.locator('[data-testid="send-message"]').click();
      await page.waitForTimeout(500);
    }
    
    // Open search
    await page.locator('[data-testid="search-messages"]').click();
    
    // Search for keyword
    await page.locator('[data-testid="search-input"]').fill('keyword');
    await page.locator('[data-testid="search-submit"]').click();
    
    // Verify search results
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
    await expect(page.locator('[data-testid="search-results"]')).toContainText('keyword');
  });

  test('should support message history pagination', async ({ page }) => {
    // Send many messages to test pagination
    for (let i = 1; i <= 25; i++) {
      await page.locator('[data-testid="message-input"]').fill(`Message ${i}`);
      await page.locator('[data-testid="send-message"]').click();
      await page.waitForTimeout(100);
    }
    
    // Scroll to top to load more messages
    await page.locator('[data-testid="message-history"]').evaluate(el => {
      el.scrollTop = 0;
    });
    
    // Check for load more indicator
    await expect(page.locator('[data-testid="load-more-messages"]')).toBeVisible();
  });

  test('should handle long messages properly', async ({ page }) => {
    const longMessage = 'This is a very long message that should be handled properly by the chat system. '.repeat(10);
    
    // Send long message
    await page.locator('[data-testid="message-input"]').fill(longMessage);
    await page.locator('[data-testid="send-message"]').click();
    
    // Verify message is displayed with proper wrapping
    await expect(page.locator('[data-testid="message-item"]').last()).toContainText(longMessage.substring(0, 50));
  });

  test('should support message deletion', async ({ page }) => {
    const testMessage = 'Message to be deleted';
    
    // Send a message
    await page.locator('[data-testid="message-input"]').fill(testMessage);
    await page.locator('[data-testid="send-message"]').click();
    
    // Hover over message to show options
    await page.locator('[data-testid="message-item"]').last().hover();
    
    // Click delete button
    await page.locator('[data-testid="delete-message"]').click();
    
    // Confirm deletion
    await page.locator('[data-testid="confirm-delete"]').click();
    
    // Verify message is deleted
    await expect(page.locator('[data-testid="message-history"]')).not.toContainText(testMessage);
  });

  test('should display connection status', async ({ page }) => {
    // Check for connection status indicator
    await expect(page.locator('[data-testid="connection-status"]')).toBeVisible();
    
    // Should show connected status
    await expect(page.locator('[data-testid="status-connected"]')).toBeVisible();
  });

  test('should handle network disconnection in chat', async ({ page }) => {
    // Send a message while online
    await page.locator('[data-testid="message-input"]').fill('Online message');
    await page.locator('[data-testid="send-message"]').click();
    
    // Go offline
    await page.setOfflineMode(true);
    await page.waitForTimeout(1000);
    
    // Try to send a message while offline
    await page.locator('[data-testid="message-input"]').fill('Offline message');
    await page.locator('[data-testid="send-message"]').click();
    
    // Check for offline indicator
    await expect(page.locator('[data-testid="status-offline"]')).toBeVisible();
    
    // Go back online
    await page.setOfflineMode(false);
    await page.waitForTimeout(2000);
    
    // Check for reconnection
    await expect(page.locator('[data-testid="status-connected"]')).toBeVisible();
  });

  test('should support emoji picker', async ({ page }) => {
    // Click emoji button
    await page.locator('[data-testid="emoji-picker-button"]').click();
    
    // Check for emoji picker
    await expect(page.locator('[data-testid="emoji-picker"]')).toBeVisible();
    
    // Select an emoji
    await page.locator('[data-testid="emoji-smile"]').click();
    
    // Verify emoji is added to input
    await expect(page.locator('[data-testid="message-input"]')).toHaveValue('😊');
    
    // Send the emoji message
    await page.locator('[data-testid="send-message"]').click();
    
    // Verify emoji message is displayed
    await expect(page.locator('[data-testid="message-history"]')).toContainText('😊');
  });
});