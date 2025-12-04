<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useAppStore } from '../../stores/useAppStore'
import { useRouter } from 'vue-router'

// Router
const router = useRouter()

// Store
const store = useAppStore()
const { currentTheme, currentLanguage } = storeToRefs(store)
const isRTL = computed(() => currentLanguage.value === 'ar')

// Organization data
interface Employee {
  id: number
  name: string
  nameEn: string
  title: string
  titleEn: string
  location: string
  locationEn: string
  image?: string
  department?: string
  departmentEn?: string
  teamSize?: number
  isCollapsed?: boolean
  children?: Employee[]
}

const organizationData = ref<Employee>({
  id: 1,
  name: 'عمرو محمد كريم',
  nameEn: 'Amr Mohamed Karim',
  title: 'Chief Executive Officer',
  titleEn: 'Chief Executive Officer',
  location: 'القاهرة، مصر',
  locationEn: 'Cairo, Egypt',
  image: '/Test1.jpg',
  children: [
    {
      id: 2,
      name: 'أحمد محمد',
      nameEn: 'Ahmed Mohamed',
      title: 'Operation Manager',
      titleEn: 'Operation Manager',
      location: 'القاهرة، مصر',
      locationEn: 'Cairo, Egypt',
      image: '/Test1.jpg',
      children: [
        {
          id: 3,
          name: 'نص تجريبي',
          nameEn: 'Test Name',
          department: 'Product Design',
          departmentEn: 'تصميم المنتجات',
          title: 'رئيس قسم التصميم',
          titleEn: 'Head of Design',
          location: 'القاهرة، مصر',
          locationEn: 'Cairo, Egypt',
          image: '/Test1.jpg',
          children: [
            {
              id: 4,
              name: 'نص تجريبي',
              nameEn: 'Test Name',
              title: 'مصمم تجربة مستخدم أول',
              titleEn: 'Senior UX Designer',
              location: 'القاهرة، مصر',
              locationEn: 'Cairo, Egypt',
              image: '/Test1.jpg'
            },
            {
              id: 5,
              name: 'نص تجريبي',
              nameEn: 'Test Name',
              title: 'مصمم واجهات',
              titleEn: 'UI Designer',
              location: 'القاهرة، مصر',
              locationEn: 'Cairo, Egypt',
              image: '/Test1.jpg'
            },
            {
              id: 6,
              name: 'نص تجريبي',
              nameEn: 'Test Name',
              title: 'مصمم منتجات',
              titleEn: 'Product Designer',
              location: 'القاهرة، مصر',
              locationEn: 'Cairo, Egypt',
              image: '/Test1.jpg'
            }
          ]
        },
        {
          id: 7,
          name: 'نص تجريبي',
          nameEn: 'Test Name',
          department: 'Development',
          departmentEn: 'التطوير',
          title: 'رئيس قسم التطوير',
          titleEn: 'Head of Development',
          location: 'القاهرة، مصر',
          locationEn: 'Cairo, Egypt',
          image: '/Test1.jpg',
          isCollapsed: true,
          children: [
            {
              id: 71,
              name: 'نص تجريبي',
              nameEn: 'Test Name',
              title: 'مطور أول',
              titleEn: 'Senior Developer',
              location: 'القاهرة، مصر',
              locationEn: 'Cairo, Egypt',
              image: '/Test1.jpg'
            },
            {
              id: 72,
              name: 'نص تجريبي',
              nameEn: 'Test Name',
              title: 'مطور واجهات أمامية',
              titleEn: 'Frontend Developer',
              location: 'القاهرة، مصر',
              locationEn: 'Cairo, Egypt',
              image: '/Test1.jpg'
            },
            {
              id: 73,
              name: 'نص تجريبي',
              nameEn: 'Test Name',
              title: 'مطور خلفي',
              titleEn: 'Backend Developer',
              location: 'القاهرة، مصر',
              locationEn: 'Cairo, Egypt',
              image: '/Test1.jpg'
            }
          ]
        },
        {
          id: 8,
          name: 'نص تجريبي',
          nameEn: 'Test Name',
          department: 'Marketing',
          departmentEn: 'التسويق',
          title: 'رئيس قسم التسويق',
          titleEn: 'Head of Marketing',
          location: 'القاهرة، مصر',
          locationEn: 'Cairo, Egypt',
          image: '/Test1.jpg',
          children: [
            {
              id: 9,
              name: 'نص تجريبي',
              nameEn: 'Test Name',
              title: 'استراتيجي المحتوى',
              titleEn: 'Content Strategist',
              location: 'القاهرة، مصر',
              locationEn: 'Cairo, Egypt',
              image: '/Test1.jpg'
            },
            {
              id: 10,
              name: 'نص تجريبي',
              nameEn: 'Test Name',
              title: 'مدير وسائل التواصل',
              titleEn: 'Social Media Manager',
              location: 'القاهرة، مصر',
              locationEn: 'Cairo, Egypt',
              image: '/Test1.jpg'
            },
            {
              id: 11,
              name: 'نص تجريبي',
              nameEn: 'Test Name',
              title: 'مصمم العلامة التجارية',
              titleEn: 'Brand Designer',
              location: 'القاهرة، مصر',
              locationEn: 'Cairo, Egypt',
              image: '/Test1.jpg'
            }
          ]
        }
      ]
    }
  ]
})

// Selected employee for modal
const selectedEmployee = ref<Employee | null>(null)
const showModal = ref(false)

// Open employee details
const openEmployeeDetails = (employee: Employee) => {
  selectedEmployee.value = employee
  showModal.value = true
}

// Close modal
const closeModal = () => {
  showModal.value = false
  setTimeout(() => {
    selectedEmployee.value = null
  }, 300)
}

// View full profile - Navigate to employee details page
const viewFullProfile = () => {
  if (selectedEmployee.value) {
    // Close modal first
    showModal.value = false
    // Navigate to organization details page
    router.push({
      name: 'OrganizationDetails',
      params: { 
        id: selectedEmployee.value.id.toString()
      }
    })
  }
}

// Toggle collapse
const toggleCollapse = (employee: Employee, event: Event) => {
  event.stopPropagation()
  employee.isCollapsed = !employee.isCollapsed
}

// Get department color
const getDepartmentColor = (dept?: string) => {
  const colors: Record<string, string> = {
    'Product Design': '#8B5CF6',
    'Development': '#10B981',
    'Marketing': '#F59E0B'
  }
  return dept ? colors[dept] || '#6b7280' : '#6b7280'
}

// Count team members (excluding department heads)
const getTeamMemberCount = (employee: Employee): number => {
  if (!employee.children || employee.children.length === 0) return 0
  // Count only children that are not department heads (don't have department property)
  return employee.children.filter(child => !child.department).length
}

// Handle escape key
const handleEscape = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && showModal.value) {
    closeModal()
  }
}

// Setup keyboard listener
onMounted(() => {
  document.addEventListener('keydown', handleEscape)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape)
})
</script>

<template>
  <div :class="$style.page" :data-theme="currentTheme" :dir="isRTL ? 'rtl' : 'ltr'">
    <div :class="$style.container">
      <!-- Page Header -->
      <header :class="$style.header">
        <h1 :class="$style.title">{{ isRTL ? 'هيكل الشركة' : 'Organization Chart' }}</h1>
      </header>

      <!-- Organization Chart -->
      <div :class="$style.chart">
        <!-- CEO Level -->
        <div :class="$style.level">
          <div :class="$style.card" @click="openEmployeeDetails(organizationData)">
            <div :class="$style.cardImage">
              <img :src="organizationData.image" :alt="isRTL ? organizationData.name : organizationData.nameEn" />
            </div>
            <div :class="$style.cardContent">
              <h3 :class="$style.cardName">{{ isRTL ? organizationData.name : organizationData.nameEn }}</h3>
              <p :class="$style.cardTitle">{{ isRTL ? organizationData.title : organizationData.titleEn }}</p>
              <p :class="$style.cardLocation">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                {{ isRTL ? organizationData.location : organizationData.locationEn }}
              </p>
            </div>
          </div>
        </div>

        <!-- Connector Line -->
        <div :class="$style.connector"></div>

        <!-- Manager Level -->
        <div v-if="organizationData.children && organizationData.children.length > 0" :class="$style.level">
          <div v-for="manager in organizationData.children" :key="manager.id" :class="$style.card" @click="openEmployeeDetails(manager)">
            <div :class="$style.cardImage">
              <img :src="manager.image" :alt="isRTL ? manager.name : manager.nameEn" />
            </div>
            <div :class="$style.cardContent">
              <h3 :class="$style.cardName">{{ isRTL ? manager.name : manager.nameEn }}</h3>
              <p :class="$style.cardTitle">{{ isRTL ? manager.title : manager.titleEn }}</p>
              <p :class="$style.cardLocation">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                {{ isRTL ? manager.location : manager.locationEn }}
              </p>
            </div>
          </div>
        </div>

        <!-- Departments Level -->
        <template v-if="organizationData.children && organizationData.children[0]?.children">
          <div :class="$style.connectorBranch"></div>
          
          <div :class="$style.departments">
            <div 
              v-for="dept in organizationData.children[0].children" 
              :key="dept.id" 
              :class="$style.department"
            >
              <!-- Department Header -->
              <button 
                v-if="dept.department"
                :class="$style.departmentBadge"
                :style="{ backgroundColor: getDepartmentColor(dept.department) }"
                @click="toggleCollapse(dept, $event)"
              >
                <span>{{ isRTL ? dept.department : dept.departmentEn }}</span>
                <span v-if="getTeamMemberCount(dept) > 0" :class="$style.teamSize">{{ getTeamMemberCount(dept) }}</span>
                <svg 
                  v-if="dept.children && dept.children.length > 0"
                  width="12" 
                  height="12" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  stroke-width="2"
                  :class="[$style.chevron, { [$style.chevronOpen]: !dept.isCollapsed }]"
                >
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>

              <!-- Department Head -->
              <div :class="$style.card" @click="openEmployeeDetails(dept)">
                <div :class="$style.cardImage">
                  <img :src="dept.image" :alt="isRTL ? dept.name : dept.nameEn" />
                </div>
                <div :class="$style.cardContent">
                  <h3 :class="$style.cardName">{{ isRTL ? dept.name : dept.nameEn }}</h3>
                  <p :class="$style.cardTitle">{{ isRTL ? dept.title : dept.titleEn }}</p>
                  <p :class="$style.cardLocation">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    {{ isRTL ? dept.location : dept.locationEn }}
                  </p>
                </div>
              </div>

              <!-- Collapsed Badge -->
              <div v-if="dept.isCollapsed && getTeamMemberCount(dept) > 0" :class="$style.collapsedBadge">
                {{ isRTL ? `+${getTeamMemberCount(dept)} عضو` : `+${getTeamMemberCount(dept)} members` }}
              </div>

              <!-- Team Members (only non-department employees) -->
              <div 
                v-else-if="dept.children && dept.children.length > 0" 
                :class="$style.team"
              >
                <div :class="$style.teamConnector"></div>
                <div :class="$style.teamMembers">
                  <div 
                    v-for="member in dept.children.filter(child => !child.department)" 
                    :key="member.id" 
                    :class="$style.teamCard"
                    @click="openEmployeeDetails(member)"
                  >
                    <div :class="$style.teamCardImage">
                      <img :src="member.image" :alt="isRTL ? member.name : member.nameEn" />
                    </div>
                    <div :class="$style.teamCardContent">
                      <h4 :class="$style.teamCardName">{{ isRTL ? member.name : member.nameEn }}</h4>
                      <p :class="$style.teamCardTitle">{{ isRTL ? member.title : member.titleEn }}</p>
                      <p :class="$style.teamCardLocation">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                          <circle cx="12" cy="10" r="3"/>
                        </svg>
                        {{ isRTL ? member.location : member.locationEn }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Employee Details Modal -->
    <Transition name="modal">
      <div v-if="showModal" :class="$style.modalOverlay" @click="closeModal">
        <div :class="$style.modalContent" @click.stop>
          <!-- Close Button -->
          <button :class="$style.closeButton" @click="closeModal">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>

          <div v-if="selectedEmployee" :class="$style.modalBody">
            <!-- Modal Header -->
            <div :class="$style.modalHeader">
              <h2 :class="$style.modalTitle">{{ isRTL ? 'معلومات الموظف' : 'Employee Information' }}</h2>
            </div>

            <!-- Employee Avatar -->
            <div :class="$style.modalAvatar">
              <img :src="selectedEmployee.image" :alt="isRTL ? selectedEmployee.name : selectedEmployee.nameEn" />
            </div>

            <!-- Employee Name & Position -->
            <div :class="$style.modalInfo">
              <h3 :class="$style.modalName">{{ isRTL ? selectedEmployee.name : selectedEmployee.nameEn }}</h3>
              <p :class="$style.modalPosition">{{ isRTL ? selectedEmployee.title : selectedEmployee.titleEn }}</p>
              <button 
                v-if="selectedEmployee.department" 
                :class="$style.modalDepartmentBadge"
                :style="{ backgroundColor: getDepartmentColor(selectedEmployee.department) }"
              >
                {{ isRTL ? selectedEmployee.department : selectedEmployee.departmentEn }}
              </button>
            </div>

            <!-- Contact Information -->
            <div :class="$style.modalSection">
              <h4 :class="$style.sectionTitle">{{ isRTL ? 'بيانات التواصل' : 'Contact Information' }}</h4>
              
              <div :class="$style.contactItem">
                <div :class="$style.contactIcon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </div>
                <div :class="$style.contactInfo">
                  <p :class="$style.contactLabel">{{ isRTL ? 'البريد الإلكتروني' : 'Email' }}</p>
                  <p :class="$style.contactValue">Mu20@company.com</p>
                </div>
              </div>

              <div :class="$style.contactItem">
                <div :class="$style.contactIcon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                </div>
                <div :class="$style.contactInfo">
                  <p :class="$style.contactLabel">{{ isRTL ? 'رقم الهاتف' : 'Phone Number' }}</p>
                  <p :class="$style.contactValue">+971 2 123 4569</p>
                </div>
              </div>

              <div :class="$style.contactItem">
                <div :class="$style.contactIcon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                </div>
                <div :class="$style.contactInfo">
                  <p :class="$style.contactLabel">{{ isRTL ? 'مدينة العمل' : 'Location' }}</p>
                  <p :class="$style.contactValue">{{ isRTL ? selectedEmployee.location : selectedEmployee.locationEn }}</p>
                </div>
              </div>
            </div>

            <!-- Job Information -->
            <div :class="$style.modalSection">
              <h4 :class="$style.sectionTitle">{{ isRTL ? 'بيانات الوظيفة' : 'Job Information' }}</h4>
              
              <div :class="$style.jobInfoGrid">
                <div :class="$style.jobInfoItem">
                  <div :class="$style.jobInfoIcon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                  </div>
                  <div>
                    <p :class="$style.jobInfoLabel">{{ isRTL ? 'المشرف' : 'Supervisor' }}</p>
                    <p :class="$style.jobInfoValue">{{ isRTL ? 'مريم سعيد أحمد' : 'Maryam Said Ahmed' }}</p>
                  </div>
                </div>

                <div :class="$style.jobInfoItem">
                  <div :class="$style.jobInfoIcon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                  </div>
                  <div>
                    <p :class="$style.jobInfoLabel">{{ isRTL ? 'تاريخ التعيين' : 'Hire Date' }}</p>
                    <p :class="$style.jobInfoValue">{{ isRTL ? '١ مايو ٢٠١٩' : '1 May 2019' }}</p>
                  </div>
                </div>

                <div :class="$style.jobInfoItem">
                  <div :class="$style.jobInfoIcon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  </div>
                  <div>
                    <p :class="$style.jobInfoLabel">{{ isRTL ? 'رقم الموظف' : 'Employee ID' }}</p>
                    <p :class="$style.jobInfoValue">EMP-2207</p>
                  </div>
                </div>

                <div :class="$style.jobInfoItem">
                  <div :class="$style.jobInfoIcon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                    </svg>
                  </div>
                  <div>
                    <p :class="$style.jobInfoLabel">{{ isRTL ? 'الإدارة والقسم' : 'Department' }}</p>
                    <p :class="$style.jobInfoValue">{{ isRTL ? 'إدارة الشؤون المالية / قسم المحاسبة' : 'Finance Department / Accounting Division' }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div :class="$style.modalActions">
              <button :class="[$style.actionButton, $style.viewProfile]" @click="viewFullProfile">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                {{ isRTL ? 'عرض الملف الكامل' : 'View Full Profile' }}
              </button>
              <button :class="[$style.actionButton, $style.sendMessage]" @click="closeModal">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="4"/>
                  <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"/>
                </svg>
                {{ isRTL ? 'إرسال رسالة' : 'Send Message' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style module>
.page {
  min-height: 100vh;
  background: #f8f9fa;
  padding: 24px;
  width: 100%;
}

.container {
  max-width: 100%;
  width: 100%;
}

/* ==================== HEADER ==================== */
.header {
  padding: 16px 0;
  text-align: start;
  margin-bottom: 32px;
}

.title {
  font-size: 32px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

/* ==================== CHART ==================== */
.chart {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

/* ==================== LEVEL ==================== */
.level {
  display: flex;
  gap: 32px;
  justify-content: center;
  flex-wrap: wrap;
  width: 100%;
}

/* ==================== CARD ==================== */
.card {
  background: white;
  border-radius: 20px;
  padding: 28px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  text-align: center;
  min-width: 260px;
  max-width: 320px;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
}

.card::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 20px;
  border: 3px solid transparent;
  transition: all 0.3s ease;
  pointer-events: none;
}

.card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
}

.card:hover::after {
  border-color: #A17D23;
}

.card:active {
  transform: translateY(-3px);
}

.cardImage {
  width: 100px;
  height: 100px;
  margin: 0 auto 20px;
  border-radius: 50%;
  overflow: hidden;
  border: 4px solid #A17D23;
}

.cardImage img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cardContent {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cardName {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.cardTitle {
  font-size: 16px;
  color: #6b7280;
  margin: 0;
  font-weight: 500;
}

.cardLocation {
  font-size: 14px;
  color: #9ca3af;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

/* ==================== MODAL ==================== */
.modalOverlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modalContent {
  background: white;
  border-radius: 24px;
  width: 100%;
  max-width: 720px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.closeButton {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: #f3f4f6;
  color: #6b7280;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  z-index: 10;
}

.page[dir="rtl"] .closeButton {
  right: auto;
  left: 20px;
}

.closeButton:hover {
  background: #e5e7eb;
  color: #1f2937;
  transform: rotate(90deg);
}

.modalBody {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.modalHeader {
  text-align: center;
}

.modalTitle {
  font-size: 17px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.modalAvatar {
  width: 90px;
  height: 90px;
  margin: 0 auto;
  border-radius: 50%;
  overflow: hidden;
  border: 4px solid #A17D23;
  box-shadow: 0 8px 24px rgba(161, 125, 35, 0.2);
}

.modalAvatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.modalInfo {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: center;
}

.modalName {
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.modalPosition {
  font-size: 15px;
  color: #6b7280;
  margin: 0;
}

.modalDepartmentBadge {
  padding: 8px 10px;
  border-radius: 20px;
  color: white;
  font-size: 14px;
  font-weight: 600;
  border: none;
  margin-top: 8px;
  cursor: default;
}

.modalSection {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sectionTitle {
  font-size: 16px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.contactItem {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px;
  background: #f9fafb;
  border-radius: 12px;
  transition: all 0.2s ease;
}

.contactItem:hover {
  background: #f3f4f6;
}

.contactIcon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #A17D23;
  flex-shrink: 0;
}

.contactInfo {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.contactLabel {
  font-size: 12px;
  color: #9ca3af;
  margin: 0;
  font-weight: 500;
}

.contactValue {
  font-size: 15px;
  color: #1f2937;
  margin: 0;
  font-weight: 500;
}

.jobInfoGrid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 8px;
}

.jobInfoItem {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 6px;
  background: #f9fafb;
  border-radius: 12px;
  transition: all 0.2s ease;
}

.jobInfoItem:hover {
  background: #f3f4f6;
}

.jobInfoIcon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #A17D23;
  flex-shrink: 0;
}

.jobInfoLabel {
  font-size: 11px;
  color: #9ca3af;
  margin: 0 0 4px 0;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.jobInfoValue {
  font-size: 14px;
  color: #1f2937;
  margin: 0;
  font-weight: 600;
}

.modalActions {
  display: flex;
  gap: 12px;
  padding-top: 8px;
}

.actionButton {
  flex: 1;
  padding: 8px;
  border-radius: 12px;
  border: none;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.viewProfile {
  background: white;
  color: #A17D23;
  border: 2px solid #A17D23;
}

.viewProfile:hover {
  background: #A17D23;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(161, 125, 35, 0.3);
}

.sendMessage {
  background: #A17D23;
  color: white;
}

.sendMessage:hover {
  background: #8a6b1d;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(161, 125, 35, 0.3);
}

/* Modal Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-active .modalContent,
.modal-leave-active .modalContent {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modalContent,
.modal-leave-to .modalContent {
  transform: scale(0.9);
  opacity: 0;
}

/* ==================== CONNECTOR ==================== */
.connector {
  width: 2px;
  height: 40px;
  background: #e5e7eb;
}

.connectorBranch {
  width: 100%;
  max-width: 800px;
  height: 2px;
  background: #e5e7eb;
  position: relative;
}

.connectorBranch::before {
  content: '';
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  width: 2px;
  height: 20px;
  background: #e5e7eb;
}

/* ==================== DEPARTMENTS ==================== */
.departments {
  display: flex;
  gap: 32px;
  justify-content: center;
  flex-wrap: wrap;
  width: 100%;
}

.department {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  position: relative;
}

.department::before {
  content: '';
  position: absolute;
  top: -18px;
  left: 50%;
  transform: translateX(-50%);
  width: 2px;
  height: 18px;
  background: #e5e7eb;
}

.departmentBadge {
  padding: 8px 16px;
  border-radius: 20px;
  color: white;
  font-size: 13px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
}

.departmentBadge:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.teamSize {
  background: rgba(255, 255, 255, 0.3);
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
}

.chevron {
  transition: transform 0.3s ease;
}

.chevronOpen {
  transform: rotate(180deg);
}

.collapsedBadge {
  background: #f3f4f6;
  color: #6b7280;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  margin-top: 8px;
}

/* ==================== TEAM ==================== */
.team {
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.teamConnector {
  width: 3px;
  height: 32px;
  background: #e5e7eb;
}

.teamMembers {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
  width: 100%;
  /* max-width: 600px; */
}

.teamCard {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.08);
  text-align: center;
  width: 100%;
  max-width: 100%;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
}

.teamCard::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 16px;
  border: 3px solid transparent;
  transition: all 0.3s ease;
  pointer-events: none;
}

.teamCard:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
}

.teamCard:hover::after {
  border-color: #A17D23;
}

.teamCard:active {
  transform: translateY(-2px);
}

.teamCardImage {
  width: 80px;
  height: 80px;
  margin: 0 auto 16px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid #A17D23;
}

.teamCardImage img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.teamCardContent {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.teamCardName {
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.teamCardTitle {
  font-size: 15px;
  color: #6b7280;
  margin: 0;
  font-weight: 500;
}

.teamCardLocation {
  font-size: 14px;
  color: #9ca3af;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

/* ==================== DARK MODE ==================== */
.page[data-theme="night"] {
  background: #121212;
}

.page[data-theme="night"] .title {
  color: #f5f5f5;
}

.page[data-theme="night"] .card,
.page[data-theme="night"] .teamCard {
  background: #1e1e1e;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
}

.page[data-theme="night"] .cardName,
.page[data-theme="night"] .teamCardName {
  color: #f5f5f5;
}

.page[data-theme="night"] .cardTitle,
.page[data-theme="night"] .teamCardTitle {
  color: #a0a0a0;
}

.page[data-theme="night"] .cardLocation,
.page[data-theme="night"] .teamCardLocation {
  color: #707070;
}

.page[data-theme="night"] .connector,
.page[data-theme="night"] .connectorBranch,
.page[data-theme="night"] .connectorBranch::before,
.page[data-theme="night"] .department::before,
.page[data-theme="night"] .teamConnector {
  background: #404040;
}

.page[data-theme="night"] .collapsedBadge {
  background: #2d2d2d;
  color: #a0a0a0;
}

.page[data-theme="night"] .modalContent {
  background: #1e1e1e;
}

.page[data-theme="night"] .modalTitle,
.page[data-theme="night"] .modalName,
.page[data-theme="night"] .contactValue,
.page[data-theme="night"] .jobInfoValue,
.page[data-theme="night"] .sectionTitle {
  color: #f5f5f5;
}

.page[data-theme="night"] .modalPosition,
.page[data-theme="night"] .contactLabel,
.page[data-theme="night"] .jobInfoLabel {
  color: #a0a0a0;
}

.page[data-theme="night"] .closeButton {
  background: #2d2d2d;
  color: #a0a0a0;
}

.page[data-theme="night"] .closeButton:hover {
  background: #404040;
  color: #f5f5f5;
}

.page[data-theme="night"] .contactItem,
.page[data-theme="night"] .jobInfoItem {
  background: #2d2d2d;
}

.page[data-theme="night"] .contactItem:hover,
.page[data-theme="night"] .jobInfoItem:hover {
  background: #353535;
}

.page[data-theme="night"] .contactIcon,
.page[data-theme="night"] .jobInfoIcon {
  background: #1e1e1e;
}

.page[data-theme="night"] .viewProfile {
  background: #1e1e1e;
  color: #A17D23;
  border-color: #A17D23;
}

.page[data-theme="night"] .viewProfile:hover {
  background: #A17D23;
  color: #1e1e1e;
}

/* ==================== RESPONSIVE ==================== */
@media (max-width: 1024px) {
  .departments {
    flex-direction: column;
    gap: 48px;
  }

  .department::before {
    display: none;
  }
}

@media (max-width: 768px) {
  .page {
    padding: 16px;
  }

  .title {
    font-size: 24px;
  }

  .level {
    flex-direction: column;
    align-items: center;
  }

  .modalBody {
    padding: 24px;
    gap: 24px;
  }

  .modalTitle {
    font-size: 20px;
  }

  .modalName {
    font-size: 22px;
  }

  .closeButton {
    top: 12px;
    right: 12px;
    width: 36px;
    height: 36px;
  }

  .jobInfoGrid {
    grid-template-columns: 1fr;
  }

  .modalActions {
    flex-direction: column;
  }

  .actionButton {
    width: 100%;
  }

  .modalOverlay {
    padding: 12px;
  }

  .modalContent {
    max-height: 95vh;
  }
}

@media (max-width: 480px) {
  .card {
    min-width: 140px;
    max-width: 160px;
  }

  .teamCard {
    max-width: 100%;
  }

  .modalAvatar {
    width: 100px;
    height: 100px;
  }

  .modalName {
    font-size: 20px;
  }

  .modalPosition {
    font-size: 14px;
  }
}
</style>
