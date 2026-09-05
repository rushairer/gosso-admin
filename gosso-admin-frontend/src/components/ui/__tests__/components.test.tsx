import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useState } from 'react';
import { Feedback } from '../Feedback';
import { StatusBadge } from '../Badge';
import { EmptyState } from '../EmptyState';
import { ConfirmDialog } from '../ConfirmDialog';
import { ToastProvider, useToast } from '../Toast';
import { LoadingSpinner, PageLoader } from '../LoadingSpinner';
import { Modal } from '../Modal';
import { FormField } from '../Form';
import { Tabs } from '../Tabs';
import { useConfirm } from '../useConfirm';
import { AsyncState } from '../AsyncState';
import { Button, IconButton } from '../Button';
import { Input, Textarea, Select } from '../Input';
import { Skeleton, TableSkeleton } from '../Skeleton';
import { Drawer } from '../Drawer';
import { Card, CardHeader, CardContent, CardFooter } from '../Card';
import { DataTable } from '../DataTable';

describe('Feedback', () => {
  it('renders error type with message', () => {
    render(<Feedback type="error">Something failed</Feedback>);
    expect(screen.getByText('Something failed')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('renders success type with message', () => {
    render(<Feedback type="success">Operation completed</Feedback>);
    expect(screen.getByText('Operation completed')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
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
      <ConfirmDialog
        open={true}
        title="Test"
        message="Confirm?"
        onConfirm={() => (confirmed = true)}
        onCancel={() => {}}
      />
    );
    fireEvent.click(screen.getByText('Confirm'));
    expect(confirmed).toBe(true);
  });

  it('calls onCancel when cancel button clicked', () => {
    let cancelled = false;
    render(
      <ConfirmDialog
        open={true}
        title="Test"
        message="Confirm?"
        onConfirm={() => {}}
        onCancel={() => (cancelled = true)}
      />
    );
    fireEvent.click(screen.getByText('Cancel'));
    expect(cancelled).toBe(true);
  });

  it('calls onCancel when the backdrop is clicked', () => {
    let cancelled = false;
    render(
      <ConfirmDialog
        open={true}
        title="Test"
        message="Confirm?"
        onConfirm={() => {}}
        onCancel={() => (cancelled = true)}
      />
    );
    fireEvent.click(screen.getByRole('dialog').parentElement!);
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

describe('LoadingSpinner & PageLoader', () => {
  it('renders LoadingSpinner with default size', () => {
    render(<LoadingSpinner />);
    const spinner = screen.getByRole('status', { name: 'Loading' });
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveStyle({ width: '32px', height: '32px' });
  });

  it('renders LoadingSpinner with sm and lg sizes', () => {
    const { rerender } = render(<LoadingSpinner size="sm" />);
    expect(screen.getByRole('status')).toHaveStyle({ width: '20px', height: '20px' });

    rerender(<LoadingSpinner size="lg" />);
    expect(screen.getByRole('status')).toHaveStyle({ width: '48px', height: '48px' });
  });

  it('renders PageLoader with message', () => {
    render(<PageLoader message="Loading accounts..." />);
    expect(screen.getByText('Loading accounts...')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});

describe('Modal', () => {
  it('does not render when isOpen is false', () => {
    const { container } = render(
      <Modal isOpen={false} onClose={() => {}}>
        Modal Content
      </Modal>
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders title, description, content, and footer when isOpen is true', () => {
    render(
      <Modal
        isOpen={true}
        onClose={() => {}}
        title="Test Modal"
        description="Test Modal Description"
        footer={<button>Confirm</button>}
      >
        <p>Modal Body Text</p>
      </Modal>
    );
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Test Modal Description')).toBeInTheDocument();
    expect(screen.getByText('Modal Body Text')).toBeInTheDocument();
    expect(screen.getByText('Confirm')).toBeInTheDocument();
  });

  it('triggers onClose when close button clicked', () => {
    let closed = false;
    render(
      <Modal isOpen={true} onClose={() => (closed = true)} title="Test">
        Content
      </Modal>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(closed).toBe(true);
  });

  it('focuses the autofocus control and restores focus after closing', () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();
    const { unmount } = render(
      <Modal isOpen={true} onClose={() => {}} title="Test">
        <input autoFocus aria-label="Modal input" />
      </Modal>
    );
    expect(screen.getByLabelText('Modal input')).toHaveFocus();
    unmount();
    expect(trigger).toHaveFocus();
    trigger.remove();
  });

  it('closes on Escape by default', () => {
    let closed = false;
    render(
      <Modal isOpen={true} onClose={() => (closed = true)}>
        Content
      </Modal>
    );
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(closed).toBe(true);
  });

  it('can hide the title close button', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="No close" showCloseButton={false}>
        Content
      </Modal>
    );
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument();
  });
});

describe('FormField', () => {
  it('associates a supplied control id with its label and exposes errors', () => {
    render(
      <FormField id="account-name" label="Account name" error="Required" required>
        <input id="account-name" />
      </FormField>
    );
    expect(screen.getByLabelText(/Account name/)).toBe(screen.getByRole('textbox'));
    expect(screen.getByRole('alert')).toHaveTextContent('Required');
  });
});

describe('Tabs', () => {
  it('reports and changes the selected tab', () => {
    let value = 'accounts';
    const onValueChange = (next: 'accounts' | 'security') => {
      value = next;
    };
    const { rerender } = render(
      <Tabs
        value={value}
        onValueChange={onValueChange}
        ariaLabel="Settings sections"
        items={[
          { value: 'accounts', label: 'Accounts' },
          { value: 'security', label: 'Security' },
        ]}
      />
    );
    expect(screen.getByRole('tab', { name: 'Accounts' })).toHaveAttribute('aria-selected', 'true');
    fireEvent.click(screen.getByRole('tab', { name: 'Security' }));
    expect(value).toBe('security');

    rerender(
      <Tabs
        value={value}
        onValueChange={onValueChange}
        ariaLabel="Settings sections"
        items={[
          { value: 'accounts', label: 'Accounts' },
          { value: 'security', label: 'Security' },
        ]}
      />
    );
    expect(screen.getByRole('tab', { name: 'Security' })).toHaveAttribute('aria-selected', 'true');
  });

  it('moves selection and focus with arrow keys', () => {
    let value: 'accounts' | 'security' = 'accounts';
    const onValueChange = (next: 'accounts' | 'security') => {
      value = next;
    };
    const { rerender } = render(
      <Tabs
        value={value}
        onValueChange={onValueChange}
        ariaLabel="Settings sections"
        items={[
          { value: 'accounts', label: 'Accounts' },
          { value: 'security', label: 'Security' },
        ]}
      />
    );
    const accounts = screen.getByRole('tab', { name: 'Accounts' });
    accounts.focus();
    fireEvent.keyDown(accounts, { key: 'ArrowRight' });
    expect(value).toBe('security');
    expect(screen.getByRole('tab', { name: 'Security' })).toHaveFocus();

    rerender(
      <Tabs
        value={value}
        onValueChange={onValueChange}
        ariaLabel="Settings sections"
        items={[
          { value: 'accounts', label: 'Accounts' },
          { value: 'security', label: 'Security' },
        ]}
      />
    );
    expect(screen.getByRole('tab', { name: 'Security' })).toHaveAttribute('tabindex', '0');
  });
});

describe('useConfirm', () => {
  function ConfirmHarness() {
    const { confirm, confirmDialog } = useConfirm();
    const [result, setResult] = useState<string>('pending');

    return (
      <>
        <button
          onClick={async () => {
            setResult((await confirm({ title: 'Remove account', message: 'Continue?' })) ? 'confirmed' : 'cancelled');
          }}
        >
          Open confirmation
        </button>
        <span>{result}</span>
        {confirmDialog}
      </>
    );
  }

  it('resolves false on cancel and true on confirmation', async () => {
    render(<ConfirmHarness />);
    fireEvent.click(screen.getByRole('button', { name: 'Open confirmation' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }));
    expect(await screen.findByText('cancelled')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Open confirmation' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Confirm' }));
    expect(await screen.findByText('confirmed')).toBeInTheDocument();
  });
});

describe('AsyncState', () => {
  it('renders loading, error retry, or content as appropriate', () => {
    const { rerender } = render(
      <AsyncState loading loadingMessage="Loading clients">
        Content
      </AsyncState>
    );
    expect(screen.getByText('Loading clients')).toBeInTheDocument();

    const retry = vi.fn();
    rerender(
      <AsyncState loading={false} error="Request failed" onRetry={retry}>
        Content
      </AsyncState>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(retry).toHaveBeenCalledOnce();

    rerender(<AsyncState loading={false}>Content</AsyncState>);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });
});

describe('Design System Primitives', () => {
  it('renders Button variants, sizes, icons, and handles loading state', () => {
    const handleClick = vi.fn();
    const { rerender } = render(
      <Button variant="primary" size="sm" onClick={handleClick}>
        Click Me
      </Button>
    );
    const btn = screen.getByRole('button', { name: 'Click Me' });
    expect(btn).toHaveClass('btn-primary', 'btn-sm');
    fireEvent.click(btn);
    expect(handleClick).toHaveBeenCalledOnce();

    rerender(
      <Button variant="primary" loading onClick={handleClick}>
        Loading Btn
      </Button>
    );
    const loadingBtn = screen.getByRole('button');
    expect(loadingBtn).toBeDisabled();
    expect(loadingBtn).toHaveAttribute('aria-busy', 'true');
    expect(loadingBtn).toHaveClass('is-loading');
  });

  it('renders IconButton with accessible label', () => {
    render(
      <IconButton label="Edit item">
        <span>Edit</span>
      </IconButton>
    );
    const btn = screen.getByRole('button', { name: 'Edit item' });
    expect(btn).toHaveAttribute('title', 'Edit item');
  });

  it('renders Input, Textarea, and Select components', () => {
    render(
      <div>
        <Input placeholder="Enter username" isError />
        <Textarea placeholder="Enter description" />
        <Select aria-label="Select role">
          <option value="admin">Admin</option>
          <option value="user">User</option>
        </Select>
      </div>
    );
    expect(screen.getByPlaceholderText('Enter username')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByPlaceholderText('Enter description')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Select role' })).toBeInTheDocument();
  });

  it('renders Skeleton and TableSkeleton', () => {
    render(
      <div>
        <Skeleton variant="rectangular" width={100} height={40} data-testid="skeleton-rect" />
        <TableSkeleton rows={3} columns={3} />
      </div>
    );
    expect(screen.getByTestId('skeleton-rect')).toHaveClass('skeleton-rectangular');
    expect(screen.getByRole('status', { name: 'Loading table data' })).toBeInTheDocument();
  });

  it('renders DataTable with built-in loading skeleton and empty state', () => {
    const { rerender } = render(<DataTable loading loadingRows={2} loadingCols={2} />);
    expect(screen.getByRole('status', { name: 'Loading table data' })).toBeInTheDocument();

    rerender(<DataTable empty emptyState={<div>No records found</div>} />);
    expect(screen.getByText('No records found')).toBeInTheDocument();

    rerender(
      <DataTable>
        <tbody>
          <tr>
            <td>Row item</td>
          </tr>
        </tbody>
      </DataTable>
    );
    expect(screen.getByText('Row item')).toBeInTheDocument();
  });

  it('renders Drawer when open and closes on ESC', () => {
    const handleClose = vi.fn();
    const { rerender } = render(
      <Drawer isOpen={true} onClose={handleClose} title="Drawer Title">
        <div>Drawer Body</div>
      </Drawer>
    );
    expect(screen.getByText('Drawer Title')).toBeInTheDocument();
    expect(screen.getByText('Drawer Body')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledOnce();

    rerender(
      <Drawer isOpen={false} onClose={handleClose} title="Drawer Title">
        <div>Drawer Body</div>
      </Drawer>
    );
    expect(screen.queryByText('Drawer Title')).not.toBeInTheDocument();
  });

  it('renders Card with header and content', () => {
    render(
      <Card>
        <CardHeader title="Card Title" description="Card Desc" />
        <CardContent>Content Area</CardContent>
      </Card>
    );
    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card Desc')).toBeInTheDocument();
    expect(screen.getByText('Content Area')).toBeInTheDocument();
  });

  it('renders AsyncState with loading, error, empty, and data states', () => {
    const { rerender } = render(
      <AsyncState loading skeleton={<div>Skeleton Loader</div>}>
        <div>Loaded Content</div>
      </AsyncState>
    );
    expect(screen.getByText('Skeleton Loader')).toBeInTheDocument();

    rerender(
      <AsyncState loading={false} error="Load failed" retryLabel="Retry Now" onRetry={() => {}}>
        <div>Loaded Content</div>
      </AsyncState>
    );
    expect(screen.getByText('Load failed')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry Now' })).toBeInTheDocument();

    rerender(
      <AsyncState loading={false} empty emptyTitle="No records found" emptyDescription="Create one to get started">
        <div>Loaded Content</div>
      </AsyncState>
    );
    expect(screen.getByText('No records found')).toBeInTheDocument();
    expect(screen.getByText('Create one to get started')).toBeInTheDocument();

    rerender(
      <AsyncState loading={false}>
        <div>Loaded Content</div>
      </AsyncState>
    );
    expect(screen.getByText('Loaded Content')).toBeInTheDocument();
  });
});
