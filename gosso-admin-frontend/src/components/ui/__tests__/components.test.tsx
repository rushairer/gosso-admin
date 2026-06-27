import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Feedback } from '../Feedback';
import { StatusBadge } from '../Badge';
import { EmptyState } from '../EmptyState';
import { ConfirmDialog } from '../ConfirmDialog';
import { ToastProvider, useToast } from '../Toast';
import { fireEvent } from '@testing-library/react';

describe('Feedback', () => {
  it('renders error type with message', () => {
    render(<Feedback type="error">Something failed</Feedback>);
    expect(screen.getByText('Something failed')).toBeInTheDocument();
  });

  it('renders success type with message', () => {
    render(<Feedback type="success">Operation completed</Feedback>);
    expect(screen.getByText('Operation completed')).toBeInTheDocument();
  });

  it('applies error class', () => {
    const { container } = render(<Feedback type="error">Error</Feedback>);
    expect(container.firstChild).toHaveClass('feedback-error');
  });

  it('applies success class', () => {
    const { container } = render(<Feedback type="success">Success</Feedback>);
    expect(container.firstChild).toHaveClass('feedback-success');
  });
});

describe('StatusBadge', () => {
  it('renders with text', () => {
    render(<StatusBadge tone="success">Active</StatusBadge>);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('applies tone class', () => {
    const { container } = render(<StatusBadge tone="danger">Suspended</StatusBadge>);
    expect(container.firstChild).toHaveClass('status-pill');
  });

  it('applies compact class', () => {
    const { container } = render(
      <StatusBadge tone="success" compact>
        Public
      </StatusBadge>
    );
    expect(container.firstChild).toHaveClass('compact');
  });
});

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(<EmptyState title="No data" description="Nothing to see here" />);
    expect(screen.getByText('No data')).toBeInTheDocument();
    expect(screen.getByText('Nothing to see here')).toBeInTheDocument();
  });
});

describe('ConfirmDialog', () => {
  it('renders nothing when open is false', () => {
    const { container } = render(
      <ConfirmDialog open={false} title="Test" message="Are you sure?" onConfirm={() => {}} onCancel={() => {}} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders title and message when open', () => {
    render(
      <ConfirmDialog open={true} title="Delete Item" message="Are you sure?" onConfirm={() => {}} onCancel={() => {}} />
    );
    expect(screen.getByText('Delete Item')).toBeInTheDocument();
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button clicked', () => {
    let confirmed = false;
    render(
      <ConfirmDialog open={true} title="Test" message="Confirm?" onConfirm={() => (confirmed = true)} onCancel={() => {}} />
    );
    fireEvent.click(screen.getByText('Confirm'));
    expect(confirmed).toBe(true);
  });

  it('calls onCancel when cancel button clicked', () => {
    let cancelled = false;
    render(
      <ConfirmDialog open={true} title="Test" message="Confirm?" onConfirm={() => {}} onCancel={() => (cancelled = true)} />
    );
    fireEvent.click(screen.getByText('Cancel'));
    expect(cancelled).toBe(true);
  });

  it('uses custom confirm label', () => {
    render(
      <ConfirmDialog
        open={true}
        title="Test"
        message="Confirm?"
        confirmLabel="Delete"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });
});

describe('ToastProvider', () => {
  function TestComponent() {
    const { showSuccess, showError, showInfo } = useToast();
    return (
      <div>
        <button onClick={() => showSuccess('Success!')}>Show Success</button>
        <button onClick={() => showError('Error!')}>Show Error</button>
        <button onClick={() => showInfo('Info!')}>Show Info</button>
      </div>
    );
  }

  it('renders children', () => {
    render(
      <ToastProvider>
        <div>Child content</div>
      </ToastProvider>
    );
    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('shows toast on showSuccess call', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    fireEvent.click(screen.getByText('Show Success'));
    expect(screen.getByText('Success!')).toBeInTheDocument();
  });

  it('shows toast on showError call', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    fireEvent.click(screen.getByText('Show Error'));
    expect(screen.getByText('Error!')).toBeInTheDocument();
  });
});
