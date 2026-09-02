import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Shield as ShieldIcon } from 'lucide-react';
import {
  Button,
  ButtonGroup,
  EmptyState,
  FormField,
  Input,
  ListRow,
  ListStack,
  Modal,
  Select,
} from '../../../components/ui';
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

  const handleAddRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      isOpen={isOpen}
      onClose={onClose}
      title={t('users.rolesModalTitle', { name: account.display_name || account.username })}
      footer={
        <Button variant="secondary" onClick={onClose}>
          {t('common.close')}
        </Button>
      }
    >
      <div className="plain-section-title">{t('users.activeRolesSection')}</div>
      <div style={{ margin: '8px 0 24px 0' }}>
        {account.roles && account.roles.length > 0 ? (
          <ListStack>
            {account.roles.map((role) => (
              <ListRow
                key={role.id}
                icon={<ShieldIcon size={16} />}
                title={role.name}
                meta={role.description}
                action={
                  <Button variant="danger" size="sm" onClick={() => onRemoveRole(role.id)} disabled={isSelf}>
                    {t('common.remove')}
                  </Button>
                }
              />
            ))}
          </ListStack>
        ) : (
          <EmptyState title={t('users.noRolesAssigned')} description={t('users.noRolesAssignedDescription')} />
        )}
      </div>

      {!isSelf && (
        <form
          onSubmit={handleAddRoleSubmit}
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '20px' }}
        >
          <FormField id="assign-role" label={t('users.assignNewRoleLabel')} noMargin>
            <ButtonGroup>
              <div className="flex-1">
                {discoveredRoles.length > 0 ? (
                  <Select id="assign-role" value={newRoleInput} onChange={(e) => setNewRoleInput(e.target.value)}>
                    <option value="">{t('users.selectDiscoveredRole')}</option>
                    {discoveredRoles
                      .filter((role) => !account.roles?.some((ur) => ur.id === role.id))
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
              <Button type="submit" variant="primary" loading={assigning} disabled={!newRoleInput || assigning}>
                {t('common.assign')}
              </Button>
            </ButtonGroup>
            <div className="form-hint">{t('users.assignRoleHint')}</div>
          </FormField>
        </form>
      )}
    </Modal>
  );
}
