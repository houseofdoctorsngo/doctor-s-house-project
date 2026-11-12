import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ api: vi.fn() }));
vi.mock('../lib/api', () => ({ api: mocks.api }));
vi.mock('../components/human-verification', () => ({ HumanVerification: () => null }));
import { Donation } from '../components/donation';
const access = { id: '11111111-1111-4111-8111-111111111111', token: 'a'.repeat(64) };
const checkout = { orderId: 'order_recovered', amount: 100000, keyId: 'rzp_test_example', mode: 'test' };
const summary = { ...access, name: 'Test Donor', amount: 1000, status: 'pending', mode: 'test', refunded: 0, checkout };
beforeEach(() => {
  sessionStorage.setItem('thd-donation-session', JSON.stringify(access));
  mocks.api.mockReset().mockImplementation(async path => path === '/api/config'
    ? { paymentsMode: 'test', turnstileSiteKey: null, assistanceEnabled: true } : summary);
});
afterEach(() => { cleanup(); sessionStorage.clear(); delete window.Razorpay; });
describe('Donation checkout recovery in the browser', () => {
  it('recovers a lost order response and keeps controls disabled until the modal closes', async () => {
    let options: { order_id?: unknown; key?: unknown; modal?: { ondismiss: () => void } } = {}; const opened = vi.fn();
    window.Razorpay = class { constructor(value: Record<string, unknown>) { options = value as typeof options; } open = opened; on() {} };
    render(<Donation/>);
    fireEvent.click(await screen.findByRole('button', { name: 'Check payment status' }));
    const resume = await screen.findByRole('button', { name: 'Resume this checkout' });
    await waitFor(() => expect(resume).toBeEnabled()); fireEvent.click(resume);
    await waitFor(() => expect(opened).toHaveBeenCalledTimes(1));
    expect(options.order_id).toBe(checkout.orderId); expect(options.key).toBe(checkout.keyId);
    expect(screen.getByRole('button', { name: 'Check payment status' })).toBeDisabled();
    expect(resume).toBeDisabled();
    expect(JSON.parse(sessionStorage.getItem('thd-donation-session')!)).toMatchObject({ ...access, ...checkout });
    await act(async () => options.modal?.ondismiss());
    await waitFor(() => expect(resume).toBeEnabled());
    expect(mocks.api.mock.calls.some(([path]) => path === '/api/payments/order')).toBe(false);
  });
  it('removes resume when an existing payment awaits capture', async () => {
    sessionStorage.setItem('thd-donation-session', JSON.stringify({ ...access, ...checkout }));
    mocks.api.mockImplementation(async path => path === '/api/config'
      ? { paymentsMode: 'test', turnstileSiteKey: null, assistanceEnabled: true }
      : { ...summary, checkout: null, awaitingCapture: true });
    render(<Donation/>);
    fireEvent.click(await screen.findByRole('button', { name: 'Check payment status' }));
    await screen.findByText(/Your payment is authorised/);
    expect(screen.queryByRole('button', { name: 'Resume this checkout' })).not.toBeInTheDocument();
  });
});
