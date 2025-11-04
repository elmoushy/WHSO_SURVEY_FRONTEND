<template>
  <div :class="$style.userTable" :dir="isRTL ? 'rtl' : 'ltr'">
    <!-- Search, Filters & Header copy -->
    <div :class="$style.tableHeader">
      <div :class="$style.headerCopy">
        <h2 :class="$style.headerTitle">
          {{ t("userManagement.users.headerTitle") }}
        </h2>
        <p :class="$style.headerDescription">
          {{ t("userManagement.users.headerSubtitle") }}
        </p>
      </div>
      <div :class="$style.searchSection">
        <div :class="$style.searchBox">
          <i class="fas fa-search" :class="$style.searchIcon"></i>
          <input
            type="text"
            :placeholder="t('userManagement.users.searchUsers')"
            :value="filters.search || ''"
            @input="onSearchChange"
            :class="$style.searchInput"
            autocomplete="off"
            autocapitalize="off"
            autocorrect="off"
            spellcheck="false"
            data-lpignore="true"
            data-1p-ignore="true"
            data-bwignore="true"
          />
        </div>

        <div :class="$style.filters">
          <select
            :value="filters.role || ''"
            @change="onRoleFilterChange"
            :class="$style.filterSelect"
          >
            <option value="">{{ t("userManagement.filters.all") }}</option>
            <option v-for="role in roles" :key="role.value" :value="role.value">
              {{ role.display }}
            </option>
          </select>

          <select
            :value="filters.is_active?.toString() || ''"
            @change="onStatusFilterChange"
            :class="$style.filterSelect"
          >
            <option value="">{{ t("userManagement.filters.all") }}</option>
            <option value="true">
              {{ t("userManagement.filters.active") }}
            </option>
            <option value="false">
              {{ t("userManagement.filters.inactive") }}
            </option>
          </select>
        </div>
      </div>

      <!-- Bulk Actions -->
      <div :class="$style.bulkActions" v-if="selectedUsers.length > 0">
        <span :class="$style.selectedCount">
          {{ selectedUsers.length }}
          {{ t("userManagement.users.selectedUsers") }}
        </span>
        <button
          :class="[$style.bulkBtn, $style.primaryBtn]"
          @click="$emit('bulk-action', 'add_to_group')"
        >
          <i class="fas fa-users"></i>
          {{ t("userManagement.users.actions.addToGroup") }}
        </button>
        <button
          :class="[$style.bulkBtn, $style.dangerBtn]"
          @click="$emit('bulk-action', 'bulk_delete')"
          :disabled="!canBulkDelete"
        >
          <i class="fas fa-trash"></i>
          {{ t("userManagement.users.actions.bulkDelete") }}
        </button>
        <button
          :class="[$style.bulkBtn, $style.secondaryBtn]"
          @click="$emit('clear-selection')"
        >
          <i class="fas fa-times"></i>
          {{ t("userManagement.buttons.cancel") }}
        </button>
      </div>
    </div>

    <!-- Table Container -->
    <div :class="$style.tableContainer">
      <table :class="$style.table">
        <thead :class="$style.tableHead">
          <tr>
            <th :class="$style.checkboxColumn">
              <input
                type="checkbox"
                @change="onSelectAllChange"
                :checked="isAllSelected"
                :class="$style.checkbox"
              />
            </th>
            <th :class="$style.sortableColumn" @click="onSortChange('email')">
              {{ t("userManagement.users.columns.email") }}
              <i :class="getSortIcon('email')"></i>
            </th>
            <th
              :class="$style.sortableColumn"
              @click="onSortChange('full_name')"
            >
              {{ t("userManagement.users.columns.name") }}
              <i :class="getSortIcon('full_name')"></i>
            </th>
            <th :class="$style.sortableColumn" @click="onSortChange('role')">
              {{ t("userManagement.users.columns.role") }}
              <i :class="getSortIcon('role')"></i>
            </th>
            <th>{{ t("userManagement.users.columns.status") }}</th>
            <th>{{ t("userManagement.users.columns.actions") }}</th>
          </tr>
        </thead>
        <tbody :class="$style.tableBody">
          <tr
            v-for="user in users"
            :key="user.id"
            :class="[
              $style.tableRow,
              { [$style.selected]: isUserSelected(user) },
            ]"
          >
            <td :class="$style.checkboxColumn">
              <input
                type="checkbox"
                :checked="isUserSelected(user)"
                @change="() => $emit('user-selected', user)"
                :class="$style.checkbox"
              />
            </td>
            <td :class="$style.emailColumn">
              <div :class="$style.userEmail">{{ user.email }}</div>
            </td>
            <td :class="$style.nameColumn">
              <div :class="$style.userName">{{ user.full_name }}</div>
            </td>
            <td :class="$style.roleColumn">
              <span :class="[$style.roleBadge, $style[user.role]]">
                {{ getRoleDisplay(user.role) }}
              </span>
            </td>
            <td :class="$style.statusColumn">
              <span
                :class="[
                  $style.statusBadge,
                  user.is_active ? $style.active : $style.inactive,
                ]"
              >
                {{
                  user.is_active
                    ? t("userManagement.users.status.active")
                    : t("userManagement.users.status.inactive")
                }}
              </span>
            </td>
            <td :class="$style.actionsColumn">
              <div :class="$style.actionButtons">
                <!-- <button 
                  :class="[$style.actionBtn, $style.viewBtn]"
                  @click="$emit('user-action', 'view', user)"
                  :title="t('userManagement.tooltips.viewUser')"
                >
                  <i class="fas fa-eye"></i>
                </button> -->

                <button
                  v-if="canEditUser(user)"
                  :class="[$style.actionBtn, $style.editBtn]"
                  @click="$emit('user-action', 'edit', user)"
                  :title="t('userManagement.tooltips.editUser')"
                >
                  <i class="fas fa-edit"></i>
                </button>

                <button
                  v-if="canResetPassword(user)"
                  :class="[$style.actionBtn, $style.resetPasswordBtn]"
                  @click="$emit('user-action', 'reset_password', user)"
                  :title="t('userManagement.tooltips.resetPassword')"
                >
                  <i class="fas fa-key"></i>
                </button>

                <button
                  v-if="canDeleteUser(user)"
                  :class="[$style.actionBtn, $style.deleteBtn]"
                  @click="$emit('user-action', 'delete', user)"
                  :title="t('userManagement.tooltips.deleteUser')"
                >
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Empty State -->
      <div v-if="users.length === 0 && !loading" :class="$style.emptyState">
        <i class="fas fa-users" :class="$style.emptyIcon"></i>
        <h3 :class="$style.emptyTitle">
          {{ t("userManagement.users.noUsersFound") }}
        </h3>
      </div>

      <!-- Loading State -->
      <div v-if="loading" :class="$style.loadingState">
        <i class="fas fa-spinner fa-spin" :class="$style.loadingIcon"></i>
        <p>{{ t("common.loading") }}...</p>
      </div>
    </div>

    <!-- Pagination -->
    <div :class="$style.pagination" v-if="totalPages > 1">
      <button
        :class="[
          $style.paginationBtn,
          { [$style.disabled]: currentPage === 1 },
        ]"
        @click="$emit('page-changed', 1)"
        :disabled="currentPage === 1"
      >
        {{ t("userManagement.pagination.first") }}
      </button>

      <button
        :class="[
          $style.paginationBtn,
          { [$style.disabled]: currentPage === 1 },
        ]"
        @click="$emit('page-changed', currentPage - 1)"
        :disabled="currentPage === 1"
      >
        {{ t("userManagement.pagination.previous") }}
      </button>

      <span :class="$style.paginationInfo">
        {{ t("userManagement.pagination.showing") }} {{ currentPage }}
        {{ t("userManagement.pagination.of") }} {{ totalPages }}
      </span>

      <button
        :class="[
          $style.paginationBtn,
          { [$style.disabled]: currentPage === totalPages },
        ]"
        @click="$emit('page-changed', currentPage + 1)"
        :disabled="currentPage === totalPages"
      >
        {{ t("userManagement.pagination.next") }}
      </button>

      <button
        :class="[
          $style.paginationBtn,
          { [$style.disabled]: currentPage === totalPages },
        ]"
        @click="$emit('page-changed', totalPages)"
        :disabled="currentPage === totalPages"
      >
        {{ t("userManagement.pagination.last") }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useAppStore } from "../../stores/useAppStore";
import type {
  User,
  UserFilters,
  SortOptions,
} from "../../types/user-management.types";

// Props
interface Props {
  users: User[];
  loading?: boolean;
  selectedUsers: User[];
  currentUser: User | null;
  totalPages: number;
  currentPage: number;
  filters: UserFilters;
  sort: SortOptions;
  roles: Array<{ value: string; display: string }>;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

// Emits
interface Emits {
  (e: "user-selected", user: User): void;
  (e: "select-all"): void;
  (e: "clear-selection"): void;
  (e: "page-changed", page: number): void;
  (e: "filters-changed", filters: Partial<UserFilters>): void;
  (e: "sort-changed", sort: SortOptions): void;
  (e: "user-action", action: string, user: User): void;
  (e: "bulk-action", action: string): void;
}

const emit = defineEmits<Emits>();

// Store
const store = useAppStore();

// Computed
const isRTL = computed(() => store.currentLanguage === "ar");
const t = computed(() => store.t);

const isAllSelected = computed(() => {
  return (
    (props.users?.length || 0) > 0 &&
    (props.selectedUsers?.length || 0) === (props.users?.length || 0)
  );
});

const canBulkDelete = computed(() => {
  if (!props.currentUser || props.selectedUsers.length === 0) return false;

  // Check if user has admin privileges
  if (
    props.currentUser.role !== "admin" &&
    props.currentUser.role !== "super_admin"
  )
    return false;

  // Check if trying to delete self
  const hasSelfSelected = props.selectedUsers.some(
    (user) => user.id === props.currentUser?.id,
  );
  if (hasSelfSelected) return false;

  // Check if trying to delete super_admin while not being super_admin
  if (props.currentUser.role === "admin") {
    const hasSuperAdminSelected = props.selectedUsers.some(
      (user) => user.role === "super_admin",
    );
    if (hasSuperAdminSelected) return false;
  }

  return true;
});

// Methods
const isUserSelected = (user: User) => {
  return props.selectedUsers.some((selected) => selected.id === user.id);
};

const canEditUser = (user: User) => {
  if (!props.currentUser) return false;
  return (
    props.currentUser.role === "super_admin" ||
    (props.currentUser.role === "admin" && user.role !== "super_admin")
  );
};

const canDeleteUser = (user: User) => {
  if (!props.currentUser) return false;

  // Cannot delete self
  if (user.id === props.currentUser.id) return false;

  // Only admin and super_admin can delete users
  if (
    props.currentUser.role !== "admin" &&
    props.currentUser.role !== "super_admin"
  )
    return false;

  // Admin cannot delete super_admin
  if (props.currentUser.role === "admin" && user.role === "super_admin")
    return false;

  return true;
};

const canResetPassword = (user: User) => {
  if (!props.currentUser) return false;

  // Cannot reset own password using this method
  if (user.id === props.currentUser.id) return false;

  // Only admin and super_admin can reset passwords
  if (
    props.currentUser.role !== "admin" &&
    props.currentUser.role !== "super_admin"
  )
    return false;

  // Admin cannot reset super_admin password
  if (props.currentUser.role === "admin" && user.role === "super_admin")
    return false;

  // Only works for regular authentication users (not Azure AD users)
  // Note: We assume users without azure_object_id are regular auth users
  if (user.azure_object_id) return false;

  return true;
};

const getRoleDisplay = (role: string) => {
  const roleObj = props.roles.find((r) => r.value === role);
  return roleObj?.display || role;
};

const getSortIcon = (field: string) => {
  if (props.sort.field !== field) return "fas fa-sort";
  return props.sort.direction === "asc" ? "fas fa-sort-up" : "fas fa-sort-down";
};

const onSearchChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit("filters-changed", { search: target.value });
};

const onRoleFilterChange = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  emit("filters-changed", { role: target.value || undefined });
};

const onStatusFilterChange = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  const value = target.value;
  let isActive: boolean | undefined = undefined;
  if (value === "true") isActive = true;
  if (value === "false") isActive = false;
  emit("filters-changed", { is_active: isActive });
};

const onSelectAllChange = () => {
  if (isAllSelected.value) {
    emit("clear-selection");
  } else {
    emit("select-all");
  }
};

const onSortChange = (field: string) => {
  const newDirection =
    props.sort.field === field && props.sort.direction === "asc"
      ? "desc"
      : "asc";
  emit("sort-changed", { field, direction: newDirection });
};
</script>

<style module>
.userTable {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
  width: 100%;
}

.tableHeader {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  align-items: center;
  gap: 1.25rem;
  padding: 0 0 0.5rem;
  background: transparent;
  border-bottom: none;
}

.headerCopy {
  grid-column: 9 / -1;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.35rem;
  min-width: 0;
  justify-self: end;
}

.searchSection {
  grid-column: span 8;
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 0.9rem;
  min-width: 0;
  justify-self: stretch;
}

.searchBox {
  position: relative;
  flex: 1;
  min-width: 200px;
}

.searchInput {
  width: 100%;
  border: none;
  border-radius: 999px;
  background: #ffffff;
  padding: 0.6rem;
  /* padding-block: 0.9rem; */
  /* padding-inline-start: 4.6rem; */
  /* padding-inline-end: 3.2rem; */
  font-size: 0.95rem;
  color: #1f2937;
  box-shadow: 0 22px 45px rgba(15, 23, 42, 0.08);
  outline: none;
  transition:
    box-shadow 0.25s ease,
    transform 0.25s ease;
}

.searchInput::placeholder {
  color: #9ca3af;
}

.searchInput:focus {
  box-shadow: 0 26px 55px rgba(161, 125, 35, 0.18);
  transform: translateY(-1px);
}

.searchIcon {
  position: absolute;
  inset-inline-end: 1.6rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1rem;
  color: #a17d23;
  pointer-events: none;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  flex: 0 0 auto;
}

.filterSelect {
  padding: 0.6rem;
  border-radius: 999px;
  border: 1px solid rgba(203, 213, 225, 0.8);
  background: #ffffff;
  color: #1f2937;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  /* box-shadow: 0 14px 32px rgba(15, 23, 42, 0.07); */
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none'%3E%3Cpath d='M6 8l4 4 4-4' stroke='%2364748B' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: left 1rem center;
  background-size: 14px;
  /* padding-inline-end: 2.6rem; */
  transition:
    border 0.25s ease,
    box-shadow 0.25s ease,
    transform 0.25s ease;
}

.filterSelect:focus {
  border-color: rgba(161, 125, 35, 0.6);
  box-shadow: 0 0 0 4px rgba(161, 125, 35, 0.12);
  outline: none;
  transform: translateY(-1px);
}

.bulkActions {
  grid-column: span 12;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 16px;
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.08);
}

.selectedCount {
  font-size: 0.9rem;
  font-weight: 600;
  color: #475569;
}

.bulkBtn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.55rem 1.05rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.bulkBtn i {
  font-size: 0.85rem;
}

.primaryBtn {
  background: linear-gradient(135deg, #b78a41, #a17d23);
  color: #ffffff;
  box-shadow: 0 12px 28px rgba(183, 138, 65, 0.35);
}

.secondaryBtn {
  background: rgba(241, 245, 249, 0.85);
  color: #475569;
  border: 1px solid rgba(226, 232, 240, 0.9);
}

.dangerBtn {
  background: linear-gradient(135deg, #f87171, #ef4444);
  color: #ffffff;
  box-shadow: 0 12px 28px rgba(239, 68, 68, 0.32);
}

.bulkBtn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 16px 32px rgba(15, 23, 42, 0.12);
}

.dangerBtn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.tableContainer {
  background: #ffffff;
  /* border-radius: 22px; */
  /* border: 1px solid rgba(226, 232, 240, 0.8); */
  /* box-shadow: 0 32px 80px rgba(15, 23, 42, 0.12); */
  overflow: hidden;
  overflow-x: auto;
}

.table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 14px;
  color: #1f2937;
  min-width: 760px;
}

.tableHead {
  background: #f5f7fa;
}

.tableHead th {
  padding: 1.1rem 1.5rem;
  font-weight: 700;
  color: #757575;
  text-align: start;
  border-bottom: 1px solid #e2e8f0;
  letter-spacing: 0.02em;
}

.tableHead th:first-child,
.tableRow td:first-child {
  text-align: center;
  /* width: 58px; */
}

.sortableColumn {
  cursor: pointer;
  user-select: none;
  transition: color 0.2s ease;
}

.sortableColumn:hover {
  color: #a17d23;
}

.tableBody {
  background: #ffffff;
}

.tableRow {
  transition:
    background 0.2s ease,
    box-shadow 0.2s ease;
}

.tableRow:hover {
  background: rgba(248, 250, 252, 0.65);
}

.tableRow.selected {
  background: rgba(183, 138, 65, 0.08);
}

.tableRow td {
  padding: 1.15rem 1.5rem;
  border-bottom: 1px solid #eff2f8;
  vertical-align: middle;
}

.tableRow:last-child td {
  border-bottom: none;
}

.checkboxColumn {
  text-align: center;
}

.checkbox {
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 6px;
  border: 1.5px solid #d4d8e6;
  background: #ffffff;
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.checkbox::after {
  content: "";
  width: 10px;
  height: 10px;
  transform: scale(0);
  transition: transform 0.2s ease;
  clip-path: polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0, 43% 62%);
  background: #ffffff;
}

.checkbox:checked {
  background: linear-gradient(135deg, #b78a41, #a17d23);
  border-color: transparent;
  box-shadow: 0 10px 20px rgba(183, 138, 65, 0.35);
}

.checkbox:checked::after {
  transform: scale(1);
}

.userEmail {
  font-weight: 600;
  color: #1f2937;
}

.userName {
  color: #334155;
  font-weight: 500;
}

.roleBadge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.95rem;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 600;
  text-transform: capitalize;
}

.roleBadge.super_admin {
  background: linear-gradient(135deg, #b78a41, #a17d23);
  color: #ffffff;
  box-shadow: 0 8px 20px rgba(183, 138, 65, 0.32);
}

.roleBadge.admin {
  background: #eef1f6;
  color: #475569;
}

.roleBadge.user {
  background: #fef3c7;
  color: #b45309;
}

.statusBadge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 84px;
  padding: 0.32rem 0.95rem;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 600;
  text-transform: capitalize;
}

.statusBadge.active {
  background: #22c55e;
  color: #ffffff;
}

.statusBadge.inactive {
  background: #fee2e2;
  color: #b91c1c;
}

.statusBadge.pending {
  background: #fef3c7;
  color: #b45309;
}

.statusBadge.overdue {
  background: #f87171;
  color: #ffffff;
}

.actionButtons {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
}

.actionBtn {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: 1px solid rgba(226, 232, 240, 0.7);
  background: #ffffff;
  color: #475569;
  display: grid;
  place-items: center;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    color 0.2s ease;
}

.actionBtn:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.12);
  color: #a17d23;
}

.editBtn:hover {
  color: #2563eb;
}

.resetPasswordBtn:hover {
  color: #f59e0b;
}

.deleteBtn:hover {
  color: #ef4444;
}

.emptyState,
.loadingState {
  padding: 4rem 2rem;
  text-align: center;
  color: #94a3b8;
  background: #ffffff;
}

.emptyIcon,
.loadingIcon {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #cbd5f5;
}

.pagination {
  padding: 1.5rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  background: #ffffff;
  border-top: 1px solid #e2e8f0;
}

.paginationBtn {
  padding: 0.55rem 1.15rem;
  border-radius: 999px;
  border: 1px solid rgba(203, 213, 225, 0.9);
  background: #ffffff;
  color: #475569;
  font-weight: 600;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    color 0.2s ease;
}

.paginationBtn:hover:not(.disabled) {
  transform: translateY(-1px);
  color: #a17d23;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.12);
}

.paginationBtn.disabled {
  opacity: 0.45;
  cursor: not-allowed;
  box-shadow: none;
}

.paginationInfo {
  color: #64748b;
  font-size: 0.9rem;
}

.headerTitle {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: #111827;
}

.headerDescription {
  margin: 0;
  font-size: 0.75rem;
  color: #6b7280;
  opacity: 0.85;
}

@media (max-width: 960px) {
  .tableHeader {
    grid-template-columns: 1fr;
    gap: 1.75rem;
  }

  .searchSection {
    grid-column: span 1;
    flex-wrap: wrap;
  }

  .headerCopy {
    grid-column: span 1;
    align-items: flex-start;
  }
}

/* RTL Support */
[dir="rtl"] .searchBox::before {
  inset-inline-start: auto;
  inset-inline-end: 1.2rem;
}

[dir="rtl"] .searchIcon {
  inset-inline-start: 1.6rem;
  inset-inline-end: auto;
}

[dir="rtl"] .headerCopy {
  grid-column: 1 / span 4;
  align-items: flex-start;
  justify-self: start;
}

[dir="rtl"] .searchInput {
  padding-inline-start: 3.2rem;
  padding-inline-end: 4.6rem;
}

[dir="rtl"] .tableHead th {
  text-align: right;
}

:global([data-theme="night"]) :local(.userTable) {
  color: #e5e7eb;
}

:global([data-theme="night"]) :local(.headerTitle) {
  color: #f9fafb;
}

:global([data-theme="night"]) :local(.headerDescription) {
  color: rgba(226, 232, 240, 0.7);
}

:global([data-theme="night"]) :local(.searchInput) {
  background: #1f2933;
  color: #f3f4f6;
  box-shadow: 0 18px 36px rgba(3, 7, 18, 0.55);
}

:global([data-theme="night"]) :local(.searchInput)::placeholder {
  color: rgba(148, 163, 184, 0.75);
}

:global([data-theme="night"]) :local(.searchIcon) {
  color: #fbbf24;
}

:global([data-theme="night"]) :local(.filterSelect) {
  background: rgba(30, 41, 59, 0.9);
  color: #f3f4f6;
  border-color: rgba(71, 85, 105, 0.6);
}

:global([data-theme="night"]) :local(.filterSelect):focus {
  border-color: rgba(250, 204, 21, 0.5);
  box-shadow: 0 0 0 4px rgba(250, 204, 21, 0.12);
}

:global([data-theme="night"]) :local(.bulkActions) {
  background: rgba(30, 41, 59, 0.9);
  box-shadow: 0 20px 48px rgba(2, 6, 23, 0.65);
}

:global([data-theme="night"]) :local(.selectedCount) {
  color: rgba(226, 232, 240, 0.8);
}

:global([data-theme="night"]) :local(.primaryBtn) {
  box-shadow: 0 16px 32px rgba(250, 204, 21, 0.28);
}

:global([data-theme="night"]) :local(.secondaryBtn) {
  background: rgba(30, 41, 59, 0.85);
  color: #cbd5f5;
  border: 1px solid rgba(71, 85, 105, 0.6);
}

:global([data-theme="night"]) :local(.tableContainer) {
  background: rgba(15, 23, 42, 0.9);
  border-color: rgba(51, 65, 85, 0.75);
  box-shadow: 0 40px 80px rgba(2, 6, 23, 0.65);
}

:global([data-theme="night"]) :local(.tableHead) {
  background: rgba(30, 41, 59, 0.9);
}

:global([data-theme="night"]) :local(.tableHead) th {
  color: rgba(226, 232, 240, 0.8);
  border-bottom-color: rgba(71, 85, 105, 0.6);
}

:global([data-theme="night"]) :local(.tableBody) {
  background: transparent;
}

:global([data-theme="night"]) :local(.tableRow):hover {
  background: rgba(30, 41, 59, 0.55);
}

:global([data-theme="night"]) :local(.tableRow.selected) {
  background: rgba(250, 204, 21, 0.12);
}

:global([data-theme="night"]) :local(.tableRow) td {
  border-bottom-color: rgba(51, 65, 85, 0.6);
}

:global([data-theme="night"]) :local(.userEmail) {
  color: #f9fafb;
}

:global([data-theme="night"]) :local(.userName) {
  color: rgba(226, 232, 240, 0.85);
}

:global([data-theme="night"]) :local(.roleBadge.admin) {
  background: rgba(30, 41, 59, 0.9);
  color: rgba(226, 232, 240, 0.82);
}

:global([data-theme="night"]) :local(.roleBadge.user) {
  background: rgba(120, 113, 198, 0.2);
  color: #e0defc;
}

:global([data-theme="night"]) :local(.statusBadge.active) {
  background: #16a34a;
}

:global([data-theme="night"]) :local(.statusBadge.inactive) {
  background: rgba(248, 113, 113, 0.25);
  color: #fca5a5;
}

:global([data-theme="night"]) :local(.statusBadge.pending) {
  background: rgba(250, 204, 21, 0.22);
  color: #fde68a;
}

:global([data-theme="night"]) :local(.statusBadge.overdue) {
  background: rgba(248, 113, 113, 0.35);
}

:global([data-theme="night"]) :local(.actionBtn) {
  background: rgba(30, 41, 59, 0.85);
  color: rgba(226, 232, 240, 0.85);
  border-color: rgba(71, 85, 105, 0.6);
}

:global([data-theme="night"]) :local(.actionBtn:hover) {
  box-shadow: 0 14px 28px rgba(2, 6, 23, 0.6);
}

:global([data-theme="night"]) :local(.emptyState),
:global([data-theme="night"]) :local(.loadingState) {
  background: rgba(15, 23, 42, 0.9);
  color: rgba(226, 232, 240, 0.75);
}

:global([data-theme="night"]) :local(.emptyIcon),
:global([data-theme="night"]) :local(.loadingIcon) {
  color: rgba(129, 140, 248, 0.4);
}

:global([data-theme="night"]) :local(.pagination) {
  background: rgba(15, 23, 42, 0.85);
  border-top-color: rgba(51, 65, 85, 0.6);
}

:global([data-theme="night"]) :local(.paginationBtn) {
  background: rgba(30, 41, 59, 0.85);
  border-color: rgba(71, 85, 105, 0.6);
  color: rgba(226, 232, 240, 0.82);
}

:global([data-theme="night"]) :local(.paginationBtn:hover:not(.disabled)) {
  color: #fbbf24;
  box-shadow: 0 12px 24px rgba(2, 6, 23, 0.5);
}

:global([data-theme="night"]) :local(.paginationInfo) {
  color: rgba(203, 213, 225, 0.75);
}
</style>
