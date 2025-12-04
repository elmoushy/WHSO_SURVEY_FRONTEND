<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAppStore } from '../../stores/useAppStore'

// Router
const route = useRoute()
const router = useRouter()

// Store
const store = useAppStore()
const { currentTheme, currentLanguage } = storeToRefs(store)
const isRTL = computed(() => currentLanguage.value === 'ar')

// Employee data interface
interface EmployeeDetails {
  id: number
  name: string
  nameEn: string
  title: string
  titleEn: string
  department: string
  departmentEn: string
  status: string
  statusEn: string
  image?: string
  
  // Personal Information
  nameAr: string
  nameEn2: string
  nationalId: string
  birthDate: string
  gender: string
  genderEn: string
  age: number
  nationality: string
  nationalityEn: string
  employeeId: string
  socialStatus: string
  socialStatusEn: string
  religion: string
  religionEn: string
  
  // Contact Information
  email: string
  officeNumber: string
  city: string
  cityEn: string
  country: string
  countryEn: string
  birthCity: string
  birthCityEn: string
  birthRegion: string
  birthRegionEn: string
  maritalStatus: string
  maritalStatusEn: string
  
  // Job Information
  employeeType: string
  employeeTypeEn: string
  startDate: string
  agency: string
  agencyEn: string
  agencyNumber: string
  jobGrade: string
  gradeNumber: string
  jobFunction: string
  jobFunctionEn: string
  jobFunctionNumber: string
  contractSection: string
  contractSectionEn: string
  section: string
  sectionEn: string
  administration: string
  administrationEn: string
  center: string
  centerEn: string
  
  // Payroll Information
  salaryBasis: string
  salaryBasisEn: string
  salaryBasisCode: string
  payrollPath: string
  payrollPathEn: string
  payrollPathNumber: string
  basicSalary: string
  totalSalary: string
  bank: string
  bankEn: string
}

// Employee data (This should be fetched from API based on route.params.id)
const employee = ref<EmployeeDetails>({
  id: 1,
  name: 'محمد إبراهيم أحمد',
  nameEn: 'Muhammad Ibrahim Ahmed',
  title: 'محاسب',
  titleEn: 'Accountant',
  department: 'قسم ادارة الشئون المالية',
  departmentEn: 'Finance Department',
  status: 'المالية',
  statusEn: 'Finance',
  image: '/Test1.jpg',
  
  // Personal
  nameAr: 'محمد إبراهيم أحمد',
  nameEn2: 'Khaled Abdullah Youssef',
  nationalId: '2751234567892',
  birthDate: '١ نوفمبر ١٩٨٨',
  gender: 'ذكر (M)',
  genderEn: 'Male (M)',
  age: 37,
  nationality: 'مصري / Egyptian (EGY)',
  nationalityEn: 'Egyptian (EGY)',
  employeeId: '124578',
  socialStatus: 'أعزب (SIN)',
  socialStatusEn: 'Single (SIN)',
  religion: 'مسلم (ISL)',
  religionEn: 'Muslim (ISL)',
  
  // Contact
  email: 'khaled.abdullah@company.ae',
  officeNumber: '204B',
  city: 'القاهرة',
  cityEn: 'Cairo',
  country: 'مصر',
  countryEn: 'Egypt',
  birthCity: 'القاهرة',
  birthCityEn: 'Cairo',
  birthRegion: 'مدينة نصر',
  birthRegionEn: 'Nasr City',
  maritalStatus: '—',
  maritalStatusEn: '—',
  
  // Job
  employeeType: 'موظف بدوام كامل',
  employeeTypeEn: 'Full Time Employee',
  startDate: '١ مايو ٢٠١٩',
  agency: 'وزارة الخارجية | Ministry of Foreign Affairs',
  agencyEn: 'Ministry of Foreign Affairs',
  agencyNumber: '3051',
  jobGrade: 'Grade 7',
  gradeNumber: '107',
  jobFunction: 'فئة المشتريات | Purchasing Job Family',
  jobFunctionEn: 'Purchasing Job Family',
  jobFunctionNumber: '55741',
  contractSection: 'وحدة المشتريات الخارجية',
  contractSectionEn: 'External Procurement Unit',
  section: 'قسم العقود',
  sectionEn: 'Contracts Section',
  administration: 'إدارة المشتريات',
  administrationEn: 'Procurement Department',
  center: 'مركز القاهرة',
  centerEn: 'Cairo Center',
  
  // Payroll
  salaryBasis: 'شهري',
  salaryBasisEn: 'Monthly',
  salaryBasisCode: 'PB01',
  payrollPath: 'Monthly Payroll',
  payrollPathEn: 'Monthly Payroll',
  payrollPathNumber: '301',
  basicSalary: '12,000 EGP',
  totalSalary: '16,500 EGP',
  bank: 'البنك الأهلي المصري',
  bankEn: 'National Bank of Egypt'
})

// Breadcrumb
const breadcrumbs = computed(() => [
  { label: isRTL.value ? 'هيكل الشركة' : 'Organization Chart', path: '/organization' },
  { label: isRTL.value ? employee.value.department : employee.value.departmentEn, path: '' },
  { label: isRTL.value ? employee.value.name : employee.value.nameEn, path: '' }
])

// Go back
const goBack = () => {
  router.back()
}

// Fetch employee data
onMounted(() => {
  const employeeId = route.params.id
  console.log('Fetching employee with ID:', employeeId)
  // TODO: Fetch employee data from API
})
</script>

<template>
  <div :class="$style.page" :data-theme="currentTheme" :dir="isRTL ? 'rtl' : 'ltr'">
    <div :class="$style.container">
      <!-- Back Button & Breadcrumb -->
      <div :class="$style.headerSection">
        <button :class="$style.backButton" @click="goBack">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline :points="isRTL ? '15 18 9 12 15 6' : '9 18 15 12 9 6'"/>
          </svg>
          {{ isRTL ? 'رجوع' : 'Back' }}
        </button>
        
        <div :class="$style.breadcrumb">
          <template v-for="(crumb, index) in breadcrumbs" :key="index">
            <router-link 
              v-if="crumb.path" 
              :to="crumb.path" 
              :class="$style.breadcrumbLink"
            >
              {{ crumb.label }}
            </router-link>
            <span v-else :class="$style.breadcrumbCurrent">{{ crumb.label }}</span>
            <span v-if="index < breadcrumbs.length - 1" :class="$style.breadcrumbSeparator">/</span>
          </template>
        </div>
      </div>

      <!-- Employee Header -->
      <div :class="$style.employeeHeader">
        <div :class="$style.employeeAvatar">
          <img :src="employee.image" :alt="isRTL ? employee.name : employee.nameEn" />
        </div>
        <div :class="$style.employeeInfo">
          <h1 :class="$style.employeeName">{{ isRTL ? employee.name : employee.nameEn }}</h1>
          <p :class="$style.employeeTitle">{{ isRTL ? employee.title : employee.titleEn }}</p>
          <span :class="$style.statusBadge">{{ isRTL ? employee.status : employee.statusEn }}</span>
        </div>
      </div>

      <!-- Details Grid -->
      <div :class="$style.detailsGrid">
        <!-- Personal Information -->
        <div :class="$style.section">
          <h2 :class="$style.sectionTitle">{{ isRTL ? 'المعلومات الشخصية' : 'Personal Information' }}</h2>
          <div :class="$style.detailsList">
            <div :class="$style.detailItem">
              <span :class="$style.detailLabel">{{ isRTL ? 'اللقب' : 'Title' }}</span>
              <span :class="$style.detailValue">{{ isRTL ? 'أ.' : 'Mr.' }}</span>
            </div>
            <div :class="$style.detailItem">
              <span :class="$style.detailLabel">{{ isRTL ? 'الاسم بالعربية' : 'Name (Arabic)' }}</span>
              <span :class="$style.detailValue">{{ employee.nameAr }}</span>
            </div>
            <div :class="$style.detailItem">
              <span :class="$style.detailLabel">{{ isRTL ? 'الاسم بالإنجليزية' : 'Name (English)' }}</span>
              <span :class="$style.detailValue">{{ employee.nameEn2 }}</span>
            </div>
            <div :class="$style.detailItem">
              <span :class="$style.detailLabel">{{ isRTL ? 'رقم الهوية الوطنية' : 'National ID' }}</span>
              <span :class="$style.detailValue">{{ employee.nationalId }}</span>
            </div>
            <div :class="$style.detailItem">
              <span :class="$style.detailLabel">{{ isRTL ? 'تاريخ الميلاد' : 'Birth Date' }}</span>
              <span :class="$style.detailValue">{{ employee.birthDate }}</span>
            </div>
            <div :class="$style.detailItem">
              <span :class="$style.detailLabel">{{ isRTL ? 'النوع' : 'Gender' }}</span>
              <span :class="$style.detailValue">{{ isRTL ? employee.gender : employee.genderEn }}</span>
            </div>
            <div :class="$style.detailItem">
              <span :class="$style.detailLabel">{{ isRTL ? 'العمر' : 'Age' }}</span>
              <span :class="$style.detailValue">{{ employee.age }} {{ isRTL ? 'سنة' : 'years' }}</span>
            </div>
            <div :class="$style.detailItem">
              <span :class="$style.detailLabel">{{ isRTL ? 'الجنسية' : 'Nationality' }}</span>
              <span :class="$style.detailValue">{{ isRTL ? employee.nationality : employee.nationalityEn }}</span>
            </div>
            <div :class="$style.detailItem">
              <span :class="$style.detailLabel">{{ isRTL ? 'رقم الموظف' : 'Employee ID' }}</span>
              <span :class="$style.detailValue">{{ employee.employeeId }}</span>
            </div>
            <div :class="$style.detailItem">
              <span :class="$style.detailLabel">{{ isRTL ? 'الحالة الاجتماعية' : 'Social Status' }}</span>
              <span :class="$style.detailValue">{{ isRTL ? employee.socialStatus : employee.socialStatusEn }}</span>
            </div>
            <div :class="$style.detailItem">
              <span :class="$style.detailLabel">{{ isRTL ? 'الديانة' : 'Religion' }}</span>
              <span :class="$style.detailValue">{{ isRTL ? employee.religion : employee.religionEn }}</span>
            </div>
          </div>
        </div>

        <!-- Contact Information -->
        <div :class="$style.section">
          <h2 :class="$style.sectionTitle">{{ isRTL ? 'بيانات الاتصال والعنوان' : 'Contact Information' }}</h2>
          <div :class="$style.detailsList">
            <div :class="$style.detailItem">
              <span :class="$style.detailLabel">{{ isRTL ? 'البريد الإلكتروني' : 'Email' }}</span>
              <span :class="$style.detailValue">{{ employee.email }}</span>
            </div>
            <div :class="$style.detailItem">
              <span :class="$style.detailLabel">{{ isRTL ? 'رقم المكتب' : 'Office Number' }}</span>
              <span :class="$style.detailValue">{{ employee.officeNumber }}</span>
            </div>
            <div :class="$style.detailItem">
              <span :class="$style.detailLabel">{{ isRTL ? 'مدينة العمل' : 'City' }}</span>
              <span :class="$style.detailValue">{{ isRTL ? employee.city : employee.cityEn }}</span>
            </div>
            <div :class="$style.detailItem">
              <span :class="$style.detailLabel">{{ isRTL ? 'دولة الميلاد' : 'Country' }}</span>
              <span :class="$style.detailValue">{{ isRTL ? employee.country : employee.countryEn }}</span>
            </div>
            <div :class="$style.detailItem">
              <span :class="$style.detailLabel">{{ isRTL ? 'مدينة الميلاد' : 'Birth City' }}</span>
              <span :class="$style.detailValue">{{ isRTL ? employee.birthCity : employee.birthCityEn }}</span>
            </div>
            <div :class="$style.detailItem">
              <span :class="$style.detailLabel">{{ isRTL ? 'منطقة الميلاد' : 'Birth Region' }}</span>
              <span :class="$style.detailValue">{{ isRTL ? employee.birthRegion : employee.birthRegionEn }}</span>
            </div>
            <div :class="$style.detailItem">
              <span :class="$style.detailLabel">{{ isRTL ? 'الطائفة' : 'Sect' }}</span>
              <span :class="$style.detailValue">{{ employee.maritalStatus }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Job & Payroll Grid -->
      <div :class="$style.detailsGrid">
        <!-- Job Information -->
        <div :class="$style.section">
          <h2 :class="$style.sectionTitle">{{ isRTL ? 'بيانات التوظيف' : 'Employment Information' }}</h2>
          <div :class="$style.detailsList">
            <div :class="$style.detailItem">
              <span :class="$style.detailLabel">{{ isRTL ? 'نوع الموظف' : 'Employee Type' }}</span>
              <span :class="$style.detailValue">{{ isRTL ? employee.employeeType : employee.employeeTypeEn }}</span>
            </div>
            <div :class="$style.detailItem">
              <span :class="$style.detailLabel">{{ isRTL ? 'تاريخ بدء العمل' : 'Start Date' }}</span>
              <span :class="$style.detailValue">{{ employee.startDate }}</span>
            </div>
            <div :class="$style.detailItem">
              <span :class="$style.detailLabel">{{ isRTL ? 'الجهة' : 'Agency' }}</span>
              <span :class="$style.detailValue">{{ isRTL ? employee.agency : employee.agencyEn }}</span>
            </div>
            <div :class="$style.detailItem">
              <span :class="$style.detailLabel">{{ isRTL ? 'رقم الجهة' : 'Agency Number' }}</span>
              <span :class="$style.detailValue">{{ employee.agencyNumber }}</span>
            </div>
            <div :class="$style.detailItem">
              <span :class="$style.detailLabel">{{ isRTL ? 'الدرجة الوظيفية' : 'Job Grade' }}</span>
              <span :class="$style.detailValue">{{ employee.jobGrade }}</span>
            </div>
            <div :class="$style.detailItem">
              <span :class="$style.detailLabel">{{ isRTL ? 'رقم الدرجة' : 'Grade Number' }}</span>
              <span :class="$style.detailValue">{{ employee.gradeNumber }}</span>
            </div>
            <div :class="$style.detailItem">
              <span :class="$style.detailLabel">{{ isRTL ? 'الوظيفة' : 'Job Function' }}</span>
              <span :class="$style.detailValue">{{ isRTL ? employee.jobFunction : employee.jobFunctionEn }}</span>
            </div>
            <div :class="$style.detailItem">
              <span :class="$style.detailLabel">{{ isRTL ? 'رقم الوظيفة' : 'Function Number' }}</span>
              <span :class="$style.detailValue">{{ employee.jobFunctionNumber }}</span>
            </div>
            <div :class="$style.detailItem">
              <span :class="$style.detailLabel">{{ isRTL ? 'الوحدة' : 'Unit' }}</span>
              <span :class="$style.detailValue">{{ isRTL ? employee.contractSection : employee.contractSectionEn }}</span>
            </div>
            <div :class="$style.detailItem">
              <span :class="$style.detailLabel">{{ isRTL ? 'القسم' : 'Section' }}</span>
              <span :class="$style.detailValue">{{ isRTL ? employee.section : employee.sectionEn }}</span>
            </div>
            <div :class="$style.detailItem">
              <span :class="$style.detailLabel">{{ isRTL ? 'الإدارة' : 'Administration' }}</span>
              <span :class="$style.detailValue">{{ isRTL ? employee.administration : employee.administrationEn }}</span>
            </div>
            <div :class="$style.detailItem">
              <span :class="$style.detailLabel">{{ isRTL ? 'المركز' : 'Center' }}</span>
              <span :class="$style.detailValue">{{ isRTL ? employee.center : employee.centerEn }}</span>
            </div>
            <div :class="$style.detailItem">
              <span :class="$style.detailLabel">{{ isRTL ? 'القطاع' : 'Sector' }}</span>
              <span :class="$style.detailValue">{{ isRTL ? 'قطاع الخدمات الإدارية' : 'Administrative Services Sector' }}</span>
            </div>
          </div>
        </div>

        <!-- Payroll Information -->
        <div :class="$style.section">
          <div :class="$style.sectionHeader">
            <h2 :class="$style.sectionTitle">{{ isRTL ? 'التعيين والمدير المباشر — بيانات الراتب Payroll' : 'Assignment & Direct Manager — Payroll' }}</h2>
            <button :class="$style.hideButton">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              {{ isRTL ? 'إخفاء' : 'Hide' }}
            </button>
          </div>
          <div :class="$style.detailsList">
            <div :class="$style.detailItem">
              <span :class="$style.detailLabel">{{ isRTL ? 'فئة الموظف' : 'Employee Category' }}</span>
              <span :class="$style.detailValue">{{ isRTL ? 'إداري' : 'Administrative' }}</span>
            </div>
            <div :class="$style.detailItem">
              <span :class="$style.detailLabel">{{ isRTL ? 'حالة التعيين' : 'Assignment Status' }}</span>
              <span :class="$style.detailValue">{{ isRTL ? 'على رأس العمل' : 'Active' }}</span>
            </div>
            <div :class="$style.detailItem">
              <span :class="$style.detailLabel">{{ isRTL ? 'كود حالة التعيين' : 'Status Code' }}</span>
              <span :class="$style.detailValue">AS001</span>
            </div>
            <div :class="$style.detailItem">
              <span :class="$style.detailLabel">{{ isRTL ? 'المدير المباشر' : 'Direct Manager' }}</span>
              <span :class="$style.detailValue">{{ isRTL ? 'أحمد حسن عبد العال' : 'Ahmed Hassan Abd El Aal' }}</span>
            </div>
            <div :class="$style.detailItem">
              <span :class="$style.detailLabel">{{ isRTL ? 'رقم المدير المباشر' : 'Manager ID' }}</span>
              <span :class="$style.detailValue">44520</span>
            </div>
            <div :class="$style.detailItem">
              <span :class="$style.detailLabel">{{ isRTL ? 'أساس الراتب' : 'Salary Basis' }}</span>
              <span :class="$style.detailValue">{{ isRTL ? employee.salaryBasis : employee.salaryBasisEn }}</span>
            </div>
            <div :class="$style.detailItem">
              <span :class="$style.detailLabel">{{ isRTL ? 'كود أساس الراتب' : 'Basis Code' }}</span>
              <span :class="$style.detailValue">{{ employee.salaryBasisCode }}</span>
            </div>
            <div :class="$style.detailItem">
              <span :class="$style.detailLabel">{{ isRTL ? 'مسار الراتب' : 'Payroll Path' }}</span>
              <span :class="$style.detailValue">{{ employee.payrollPath }}</span>
            </div>
            <div :class="$style.detailItem">
              <span :class="$style.detailLabel">{{ isRTL ? 'رقم مسار الراتب' : 'Path Number' }}</span>
              <span :class="$style.detailValue">{{ employee.payrollPathNumber }}</span>
            </div>
            <div :class="$style.detailItem">
              <span :class="$style.detailLabel">{{ isRTL ? 'الراتب الأساسي' : 'Basic Salary' }}</span>
              <span :class="$style.detailValue">{{ employee.basicSalary }}</span>
            </div>
            <div :class="$style.detailItem">
              <span :class="$style.detailLabel">{{ isRTL ? 'الراتب الإجمالي' : 'Total Salary' }}</span>
              <span :class="$style.detailValue">{{ employee.totalSalary }}</span>
            </div>
            <div :class="$style.detailItem">
              <span :class="$style.detailLabel">{{ isRTL ? 'البنك' : 'Bank' }}</span>
              <span :class="$style.detailValue">{{ isRTL ? employee.bank : employee.bankEn }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Wظيفة Section -->
      <div :class="$style.jobSection">
        <h2 :class="$style.sectionTitle">{{ isRTL ? 'الوظيفة' : 'Position' }}</h2>
        <div :class="$style.detailsList">
          <div :class="$style.detailItem">
            <span :class="$style.detailLabel">{{ isRTL ? 'المسمى الوظيفي' : 'Job Title' }}</span>
            <span :class="$style.detailValue">{{ isRTL ? 'أخصائي مشتريات | Procurement Specialist' : 'Procurement Specialist' }}</span>
          </div>
          <div :class="$style.detailItem">
            <span :class="$style.detailLabel">{{ isRTL ? 'رقم الوظيفة' : 'Position Number' }}</span>
            <span :class="$style.detailValue">88025</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style module>
.page {
  min-height: 100vh;
  background: #f8f9fa;
  padding: 24px;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
}

/* Header Section */
.headerSection {
  margin-bottom: 24px;
}

.backButton {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  color: #A17D23;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 16px;
}

.backButton:hover {
  background: #A17D23;
  color: white;
  border-color: #A17D23;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(161, 125, 35, 0.2);
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  font-size: 14px;
  color: #6b7280;
}

.breadcrumbLink {
  color: #A17D23;
  text-decoration: none;
  transition: color 0.2s;
}

.breadcrumbLink:hover {
  color: #8a6b1d;
  text-decoration: underline;
}

.breadcrumbCurrent {
  color: #1f2937;
  font-weight: 500;
}

.breadcrumbSeparator {
  color: #d1d5db;
}

/* Employee Header */
.employeeHeader {
  background: white;
  border-radius: 16px;
  padding: 32px;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.employeeAvatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  border: 4px solid #A17D23;
  flex-shrink: 0;
}

.employeeAvatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.employeeInfo {
  flex: 1;
}

.employeeName {
  font-size: 32px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.employeeTitle {
  font-size: 18px;
  color: #6b7280;
  margin: 0 0 12px 0;
}

.statusBadge {
  display: inline-block;
  padding: 8px 16px;
  background: #10B981;
  color: white;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
}

/* Details Grid */
.detailsGrid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: 24px;
  margin-bottom: 24px;
}

.section {
  background: white;
  border-radius: 16px;
  padding: 28px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.sectionHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.sectionTitle {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 20px 0;
}

.hideButton {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: transparent;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  color: #6b7280;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.hideButton:hover {
  background: #f9fafb;
  border-color: #d1d5db;
}

.detailsList {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detailItem {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 16px;
  border-bottom: 1px solid #f3f4f6;
}

.detailItem:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.detailLabel {
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
  flex: 1;
}

.detailValue {
  font-size: 15px;
  color: #1f2937;
  font-weight: 600;
  flex: 1.5;
  text-align: end;
}

.jobSection {
  background: white;
  border-radius: 16px;
  padding: 28px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

/* Dark Mode */
.page[data-theme="night"] {
  background: #121212;
}

.page[data-theme="night"] .backButton,
.page[data-theme="night"] .employeeHeader,
.page[data-theme="night"] .section,
.page[data-theme="night"] .jobSection {
  background: #1e1e1e;
  border-color: #404040;
}

.page[data-theme="night"] .employeeName,
.page[data-theme="night"] .breadcrumbCurrent,
.page[data-theme="night"] .sectionTitle,
.page[data-theme="night"] .detailValue {
  color: #f5f5f5;
}

.page[data-theme="night"] .employeeTitle,
.page[data-theme="night"] .breadcrumb,
.page[data-theme="night"] .detailLabel,
.page[data-theme="night"] .hideButton {
  color: #a0a0a0;
}

.page[data-theme="night"] .detailItem {
  border-bottom-color: #2d2d2d;
}

.page[data-theme="night"] .backButton:hover {
  background: #A17D23;
  color: white;
}

/* Responsive */
@media (max-width: 768px) {
  .page {
    padding: 16px;
  }

  .employeeHeader {
    flex-direction: column;
    text-align: center;
    padding: 24px;
  }

  .employeeName {
    font-size: 24px;
  }

  .detailsGrid {
    grid-template-columns: 1fr;
  }

  .detailItem {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .detailValue {
    text-align: start;
  }

  .sectionHeader {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>
