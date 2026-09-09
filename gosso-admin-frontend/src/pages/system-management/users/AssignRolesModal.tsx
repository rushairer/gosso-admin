import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Shield as ShieldIcon } from 'lucide-react';
import { Button, Empty, FormField, Input, Modal, Select, Text } from '@gouno/ui/core';
import type { Account, Role } from '../../../types/api';

interface AssignRolesModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: Account | null;
  discoveredRoles: Role[];
  currentAdminId?: string;
  onAssignRole: (roleId: string) => Promise<void>;
  onRemoveRole: (roleId: string) => Promise<void>;
}

export function AssignRolesModal({
  isOpen,
  onClose,
  account,
  discoveredRoles,
  currentAdminId,
  onAssignRole,
  onRemoveRole,
}: AssignRolesModalProps) {
  const { t } = useTranslation();
  const [newRoleInput, setNewRoleInput] = useState('');
  const [assigning, setAssigning] = useState(false);

  if (!isOpen || !account) return null;

  const handleAddRoleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newRoleInput) return;
    setAssigning(true);
    try {
      await onAssignRole(newRoleInput);
      setNewRoleInput('');
    } finally {
      setAssigning(false);
    }
  };

  const isSelf = account.id === currentAdminId;

  return (
    <Modal
      open={isOpen}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={t('users.rolesModalTitle', { name: account.display_name || account.username })}
      description={t('users.assignRoleHint')}
      footer={<Button onClick={onClose}>{t('common.close')}</Button>}
    >
      <div className="flex flex-col gap-5">
        {account.roles && account.roles.length > 0 ? (
          <ul className="divide-y overflow-hidden rounded-lg border border-border/80 bg-card">
            {account.roles.map((role) => (
              <li key={role.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <ShieldIcon aria-hidden="true" className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <Text as="div" className="font-semibold">{role.name}</Text>
                    {role.description ? <Text size="xs" tone="muted">{role.description}</Text> : null}
                  </div>
                </div>
                <Button size="small" variant="solid" color="error" onClick={() => void onRemoveRole(role.id)} disabled={isSelf}>
                  {t('common.remove')}
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <Empty title={t('users.noRolesAssigned')} description={t('users.noRolesAssignedDescription')} />
        )}

        {!isSelf ? (
          <form onSubmit={handleAddRoleSubmit} className="border-t pt-5">
            <FormField id="assign-role" label={t('users.assignNewRoleLabel')}>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="min-w-0 flex-1">
                  {discoveredRoles.length > 0 ? (
                    <Select id="assign-role" value={newRoleInput} onChange={(e) => setNewRoleInput(e.target.value)}>
                      <option value="">{t('users.selectDiscoveredRole')}</option>
                      {discoveredRoles
                        .filter((role) => !account.roles?.some((assigned) => assigned.id === role.id))
                        .map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.name} ({role.id.substring(0, 8)})
                          </option>
                        ))}
                    </Select>
                  ) : (
                    <Input
                      id="assign-role"
                      type="text"
                      placeholder={t('users.enterRoleUuid')}
                      value={newRoleInput}
                      onChange={(e) => setNewRoleInput(e.target.value)}
                    />
                  )}
                </div>
                <Button type="submit" variant="solid" color="primary" loading={assigning} disabled={!newRoleInput || assigning}>
                  {t('common.assign')}
                </Button>
              </div>
            </FormField>
          </form>
        ) : null}
      </div>
    </Modal>
  );
}
