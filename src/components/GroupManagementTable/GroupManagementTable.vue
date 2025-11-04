<template>
  <div :class="$style.groupTable" :dir="isRTL ? 'rtl' : 'ltr'">
    <!-- Search, Filter & Header copy -->
    <div :class="$style.tableHeader">
      <div :class="$style.headerCopy">
        <h2 :class="$style.headerTitle">
          {{ t("userManagement.groups.headerTitle") }}
        </h2>
        <p :class="$style.headerDescription">
          {{ t("userManagement.groups.headerSubtitle") }}
        </p>
      </div>

      <div :class="$style.searchSection">
        <div :class="$style.searchBox">
          <i class="fas fa-search" :class="$style.searchIcon"></i>
          <input
            type="text"
            :placeholder="t('userManagement.groups.searchGroups')"
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
          <slot name="filters"></slot>
        </div>
      </div>
    </div>

    <!-- Table Container -->
    <div :class="$style.tableContainer">
      <table :class="$style.table">
        <thead :class="$style.tableHead">
          <tr>
            <th :class="$style.checkboxColumn">
              <input type="checkbox" :class="$style.checkbox" />
            </th>
            <th :class="$style.nameColumn">
              {{ t("userManagement.groups.columns.name") }}
            </th>
            <th :class="$style.countColumn">
              {{ t("userManagement.groups.columns.adminCount") }}
            </th>
            <th :class="$style.countColumn">
              {{ t("userManagement.groups.columns.userCount") }}
            </th>
            <th :class="$style.actionsColumn">
              {{ t("userManagement.groups.columns.actions") }}
            </th>
          </tr>
        </thead>
        <tbody :class="$style.tableBody">
          <tr v-for="group in groups" :key="group.id" :class="$style.tableRow">
            <td :class="$style.checkboxCell">
              <input type="checkbox" :class="$style.checkbox" />
            </td>
            <td :class="$style.nameCell">{{ group.name }}</td>
            <td :class="$style.countCell">{{ group.admin_count }}</td>
            <td :class="$style.countCell">{{ group.user_count }}</td>
            <td :class="$style.actionsCell">
              <div :class="$style.actionButtons">
                <button
                  :class="[$style.actionBtn, $style.addUsersBtn]"
                  @click="handleAddUsersClick(group)"
                  :title="t('userManagement.groups.actions.addUsers')"
                >
                  <i class="fas fa-user-plus"></i>
                </button>
                <button
                  :class="[$style.actionBtn, $style.viewBtn]"
                  @click="$emit('group-action', 'view', group)"
                  :title="t('userManagement.groups.actions.view')"
                >
                  <i class="fas fa-eye"></i>
                </button>
                <button
                  :class="[$style.actionBtn, $style.editBtn]"
                  @click="$emit('group-action', 'edit', group)"
                  :title="t('userManagement.groups.actions.edit')"
                >
                  <i class="fas fa-edit"></i>
                </button>
                <button
                  :class="[$style.actionBtn, $style.deleteBtn]"
                  @click="$emit('group-action', 'delete', group)"
                  :title="t('userManagement.groups.actions.delete')"
                >
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="groups.length === 0 && !loading" :class="$style.emptyState">
        <i class="fas fa-layer-group" :class="$style.emptyIcon"></i>
        <h3 :class="$style.emptyTitle">
          {{ t("userManagement.groups.noGroupsFound") }}
        </h3>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useAppStore } from "../../stores/useAppStore";
import type { Group, GroupFilters } from "../../types/user-management.types";

interface Props {
  groups: Group[];
  loading?: boolean;
  selectedGroups: Group[];
  currentUser: any;
  totalPages: number;
  currentPage: number;
  filters: GroupFilters;
}

defineProps<Props>();

interface Emits {
  (e: "filters-changed", filters: Partial<GroupFilters>): void;
  (e: "group-action", action: string, group: Group): void;
}

const emit = defineEmits<Emits>();

const store = useAppStore();
const isRTL = computed(() => store.currentLanguage === "ar");
const t = computed(() => store.t);

const onSearchChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit("filters-changed", { search: target.value });
};

const handleAddUsersClick = (group: Group) => {
  emit("group-action", "add_users", group);
};
</script>

<style module>
.groupTable {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.tableHeader {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  align-items: center;
  gap: 1.25rem;
  padding-bottom: 0.5rem;
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

.searchSection {
  grid-column: span 8;
  display: flex;
  align-items: center;
  gap: 0.9rem;
}

.searchBox {
  position: relative;
  flex: 1;
  max-width: 400px;
  margin-right: auto;
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
  inset-inline-start: 1.6rem;
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
  padding: 0.85rem 1.35rem;
  border-radius: 999px;
  border: 1px solid rgba(203, 213, 225, 0.8);
  background: #ffffff;
  color: #1f2937;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
}

.tableContainer {
  background: #ffffff;
  border-radius: 22px;
  border: 1px solid rgba(226, 232, 240, 0.8);
  box-shadow: 0 32px 80px rgba(15, 23, 42, 0.12);
  overflow: hidden;
}

.table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.tableHead {
  background: #f8fafc;
}

.tableHead th {
  padding: 1.1rem 1.5rem;
  font-weight: 700;
  color: #475569;
  text-align: start;
  border-bottom: 1px solid #e2e8f0;
}

.checkboxColumn {
  width: 58px;
  text-align: center !important;
}

.countColumn {
  width: 120px;
  text-align: center !important;
}

.actionsColumn {
  width: 200px;
  text-align: center !important;
}

.tableRow td {
  padding: 1.15rem 1.5rem;
  border-bottom: 1px solid #eff2f8;
}

.actionButtons {
  display: inline-flex;
  gap: 0.45rem;
}

.actionBtn {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: 1px solid rgba(226, 232, 240, 0.7);
  background: #ffffff;
}

.emptyState {
  padding: 4rem 2rem;
  text-align: center;
}

.emptyIcon {
  font-size: 3rem;
  margin-bottom: 1rem;
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
    justify-self: start;
  }
}

[dir="rtl"] .searchBox::before {
  inset-inline-start: auto;
  inset-inline-end: 1.2rem;
}

[dir="rtl"] .searchInput {
  padding-inline-start: 3.2rem;
  padding-inline-end: 4.6rem;
}

[dir="rtl"] .headerCopy {
  grid-column: 1 / span 4;
  align-items: flex-start;
  justify-self: start;
}

:global([data-theme="night"]) :local(.groupTable) {
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

:global([data-theme="night"]) :local(.tableContainer) {
  background: rgba(15, 23, 42, 0.9);
  border-color: rgba(51, 65, 85, 0.75);
  box-shadow: 0 40px 80px rgba(2, 6, 23, 0.65);
}

:global([data-theme="night"]) :local(.tableHead) {
  background: rgba(30, 41, 59, 0.9);
}

:global([data-theme="night"]) :local(.tableHead) th {
  color: rgba(226, 232, 240, 0.78);
  border-bottom-color: rgba(71, 85, 105, 0.6);
}

:global([data-theme="night"]) :local(.tableRow) td {
  border-bottom-color: rgba(51, 65, 85, 0.6);
}

:global([data-theme="night"]) :local(.tableRow:hover) {
  background: rgba(30, 41, 59, 0.55);
}

:global([data-theme="night"]) :local(.actionBtn) {
  background: rgba(30, 41, 59, 0.85);
  color: rgba(226, 232, 240, 0.85);
  border-color: rgba(71, 85, 105, 0.6);
}

:global([data-theme="night"]) :local(.actionBtn:hover) {
  box-shadow: 0 14px 28px rgba(2, 6, 23, 0.6);
}

:global([data-theme="night"]) :local(.emptyState) {
  background: rgba(15, 23, 42, 0.9);
  color: rgba(226, 232, 240, 0.75);
}

:global([data-theme="night"]) :local(.emptyIcon) {
  color: rgba(129, 140, 248, 0.4);
}
</style>
