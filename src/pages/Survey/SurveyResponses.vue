<template>
  <div
    :class="$style.responsesContainer"
    :data-theme="currentTheme"
    :dir="isRTL ? 'rtl' : 'ltr'"
  >
    <!-- Header Section -->
    <section :class="$style.headerSection">
      <div :class="$style.headerContent">
        <div :class="$style.headerActions">
      

          <button
            :class="[$style.headerButton, $style.secondaryButton]"
            @click="goBack"
          >
           <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M7.5013 18.3337H12.5013C16.668 18.3337 18.3346 16.667 18.3346 12.5003V7.50033C18.3346 3.33366 16.668 1.66699 12.5013 1.66699H7.5013C3.33464 1.66699 1.66797 3.33366 1.66797 7.50033V12.5003C1.66797 16.667 3.33464 18.3337 7.5013 18.3337Z" stroke="#A17D23" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M7.4987 12.8159H11.5987C13.0154 12.8159 14.1654 11.666 14.1654 10.2493C14.1654 8.83262 13.0154 7.68262 11.5987 7.68262H5.95703" stroke="#A17D23" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M7.14036 8.9746L5.83203 7.65794L7.14036 6.34961" stroke="#A17D23" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>

            <span>{{ t("common.back") }}</span>
          </button>
              <button
            :class="[$style.headerButton, $style.primaryButton]"
            @click="showFormatModal = true"
            :disabled="isExporting"
            title="تحميل جميع الاستجابات"
          >
            <i v-if="isExporting" class="fas fa-spinner fa-spin"></i>
           <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M17 9.00195C19.175 9.01406 20.3529 9.11051 21.1213 9.8789C22 10.7576 22 12.1718 22 15.0002V16.0002C22 18.8286 22 20.2429 21.1213 21.1215C20.2426 22.0002 18.8284 22.0002 16 22.0002H8C5.17157 22.0002 3.75736 22.0002 2.87868 21.1215C2 20.2429 2 18.8286 2 16.0002L2 15.0002C2 12.1718 2 10.7576 2.87868 9.87889C3.64706 9.11051 4.82497 9.01406 7 9.00195" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
<path d="M12 2L12 15M12 15L9 11.5M12 15L15 11.5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>

            <span>{{
              isExporting ? "جاري التحميل..." : "تصدير البيانات"
            }}</span>
          </button>
        </div>
        <div :class="$style.breadcrumbWrapper">
          <span :class="$style.breadcrumb">
            <span :class="$style.title">{{ isRTL ? "إدارة الاستطلاعات" : "Survey Management" }}</span>
            <span> / </span>
            <strong>{{ isRTL ? "عرض الردود" : "Responses" }}</strong>
          </span>
        
          <div :class="$style.pageSubtitle">
          <div :class="$style.subtitleItem">
            {{ isRTL ? "الردود الأحدث" : "Latest responses" }} 
          </div>
              
            <div>
            {{ isRTL ? "إجمالي" : "Total" }} {{ responses.length }} رد
          </div>
          </div>
        </div>
      </div>
  <!-- Navigation Tabs -->
      <div :class="$style.tabsHeader">
        <button
          :class="[
            $style.tabBtn,
            { [$style.tabBtnActive]: activeTab === 'responses' },
          ]"
          @click="activeTab = 'responses'"
        >
          <i class="fas fa-list-ul"></i>
          {{ t("survey.responses.title") }}
        </button>
        <button
          :class="[
            $style.tabBtn,
            { [$style.tabBtnActive]: activeTab === 'analytics' },
          ]"
          @click="switchToAnalytics"
        >
          <i class="fas fa-chart-line"></i>
          {{ t("survey.analytics.dashboard") }}
        </button>
      </div>
      <section v-show="activeTab === 'analytics'" :class="$style.metricsSection">
        <div :class="$style.metricsGrid">
          <div
            v-for="card in overviewCards"
            :key="card.key"
            :class="$style.metricCard"
          >
            <div v-if="card.icon" :class="$style.metricIcon" v-html="card.icon"></div>
            <div :class="$style.metricContent">
              <div :class="$style.metricLabel">{{ card.label }}</div>
              <div :class="$style.metricValue">
                {{ card.value }}
                <span v-if="card.suffix" :class="$style.metricSuffix">{{
                  card.suffix
                }}</span>
                <span v-if="card.period" :class="$style.metricPeriod">{{
                  card.period
                }}</span>
              </div>
            
            </div>
          </div>
        </div>
      </section>

    
    </section>

    <!-- Tab Content -->
    <div :class="$style.tabContent">
      <!-- Responses Tab -->
      <div v-show="activeTab === 'responses'" :class="$style.tabPanel">
        <!-- Responses List -->

        <div :class="$style.responsesSection">
          <div v-if="isLoading" :class="$style.loadingContainer">
            <div :class="$style.loadingSpinner"></div>
            <p :class="$style.loadingText">جاري تحميل الردود...</p>
          </div>

          <div v-else-if="responses.length === 0" :class="$style.emptyState">
            <div :class="$style.emptyIcon">
              <i class="fas fa-inbox"></i>
            </div>
            <h3 :class="$style.emptyTitle">
              {{ t("survey.responses.noResponses") }}
            </h3>
            <p :class="$style.emptyDescription">
              {{ t("survey.responses.noResponsesDescription") }}
            </p>
          </div>

          <div v-else :class="$style.responsesList">
            <div
              v-for="response in responses"
              :key="response.id"
              :class="$style.responseCard"
            >
              <div
                :class="$style.responseHeader"
                @click="expandResponse(response.id)"
              >
                <div :class="$style.respondentInfo">
               
                  <div :class="$style.respondentDetails">
                  
                    
                    <div :class="$style.respondentMeta">
                      <span :class="$style.respondentType">
                        {{
                          response.respondent.type === "authenticated"
                            ? t("survey.responses.authenticatedUser")
                            : t("survey.responses.anonymousUser")
                        }}
                      </span>
                      <span :class="$style.submissionDate">
                        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M1.25 7.5C1.25 5.14298 1.25 3.96447 1.98223 3.23223C2.71447 2.5 3.89298 2.5 6.25 2.5H8.75C11.107 2.5 12.2855 2.5 13.0178 3.23223C13.75 3.96447 13.75 5.14298 13.75 7.5V8.75C13.75 11.107 13.75 12.2855 13.0178 13.0178C12.2855 13.75 11.107 13.75 8.75 13.75H6.25C3.89298 13.75 2.71447 13.75 1.98223 13.0178C1.25 12.2855 1.25 11.107 1.25 8.75V7.5Z" stroke="#717784" stroke-width="0.9375"/>
                          <path d="M4.375 2.5V1.5625" stroke="#717784" stroke-width="0.9375" stroke-linecap="round"/>
                          <path d="M10.625 2.5V1.5625" stroke="#717784" stroke-width="0.9375" stroke-linecap="round"/>
                          <path d="M1.5625 5.625H13.4375" stroke="#717784" stroke-width="0.9375" stroke-linecap="round"/>
                          <path d="M11.25 10.625C11.25 10.9702 10.9702 11.25 10.625 11.25C10.2798 11.25 10 10.9702 10 10.625C10 10.2798 10.2798 10 10.625 10C10.9702 10 11.25 10.2798 11.25 10.625Z" fill="#717784"/>
                          <path d="M11.25 8.125C11.25 8.47018 10.9702 8.75 10.625 8.75C10.2798 8.75 10 8.47018 10 8.125C10 7.77982 10.2798 7.5 10.625 7.5C10.9702 7.5 11.25 7.77982 11.25 8.125Z" fill="#717784"/>
                          <path d="M8.125 10.625C8.125 10.9702 7.84518 11.25 7.5 11.25C7.15482 11.25 6.875 10.9702 6.875 10.625C6.875 10.2798 7.15482 10 7.5 10C7.84518 10 8.125 10.2798 8.125 10.625Z" fill="#717784"/>
                          <path d="M8.125 8.125C8.125 8.47018 7.84518 8.75 7.5 8.75C7.15482 8.75 6.875 8.47018 6.875 8.125C6.875 7.77982 7.15482 7.5 7.5 7.5C7.84518 7.5 8.125 7.77982 8.125 8.125Z" fill="#717784"/>
                          <path d="M5 10.625C5 10.9702 4.72018 11.25 4.375 11.25C4.02982 11.25 3.75 10.9702 3.75 10.625C3.75 10.2798 4.02982 10 4.375 10C4.72018 10 5 10.2798 5 10.625Z" fill="#717784"/>
                          <path d="M5 8.125C5 8.47018 4.72018 8.75 4.375 8.75C4.02982 8.75 3.75 8.47018 3.75 8.125C3.75 7.77982 4.02982 7.5 4.375 7.5C4.72018 7.5 5 7.77982 5 8.125Z" fill="#717784"/>
                        </svg>
                        <div>{{ formatDate(response.submitted_at).date }}</div>
                        <div>{{ formatDate(response.submitted_at).time }}</div>
                      </span>
                    </div>
                  </div>
                     <div :class="$style.respondentAvatar">
               <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M0 24C0 10.7452 10.7452 0 24 0C37.2548 0 48 10.7452 48 24C48 37.2548 37.2548 48 24 48C10.7452 48 0 37.2548 0 24Z" fill="#F5F5F5"/>
<path d="M31 33V31C31 29.9391 30.5786 28.9217 29.8284 28.1716C29.0783 27.4214 28.0609 27 27 27H21C19.9391 27 18.9217 27.4214 18.1716 28.1716C17.4214 28.9217 17 29.9391 17 31V33" stroke="#4A5565" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M24 23C26.2091 23 28 21.2091 28 19C28 16.7909 26.2091 15 24 15C21.7909 15 20 16.7909 20 19C20 21.2091 21.7909 23 24 23Z" stroke="#4A5565" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>

                  </div>
                </div>

                <div :class="$style.responseStatus">
                  <span
                    :class="[
                      $style.statusBadge,
                      response.is_complete
                        ? $style.complete
                        : $style.incomplete,
                    ]"
                  >
                    <i
                      :class="
                        response.is_complete
                          ? 'fas fa-check-circle'
                          : 'fas fa-clock'
                      "
                    ></i>
                    {{
                      response.is_complete
                        ? t("survey.responses.completed")
                        : t("survey.responses.incomplete")
                    }}
                  </span>
                </div>
              </div>

              <div :class="$style.responsePreview">
                <div :class="$style.answersSummary">
                  <div :class="$style.answersCount">
                    {{ response.answer_count || response.answers?.length || 0 }}
                    {{ t("survey.responses.answersProvided") }}
                  </div>
                  <div :class="$style.progressBar">
                    <div
                      :class="$style.progressFill"
                      :style="{
                        width: getCompletionPercentage(response) + '%',
                      }"
                    ></div>
                  </div>
                </div>

                <div
                  v-if="expandedResponse === response.id"
                  :class="$style.responseDetails"
                >
                  <div :class="$style.responseDetailsHeader">
                    <div :class="$style.detailsHeaderIcon">
                      <i class="fas fa-clipboard-list"></i>
                    </div>
                    <h4 :class="$style.detailsHeaderTitle">
                      الإجابات التفصيلية
                    </h4>
                    <div :class="$style.detailsHeaderBadge">
                      {{ response.answers?.length || 0 }}
                      {{ t("survey.responses.answers") }}
                    </div>
                  </div>
                  <div :class="$style.answersGrid">
                    <div
                      v-for="answer in response.answers"
                      :key="answer.question_id"
                      :class="$style.answerCard"
                    >
                      <div :class="$style.answerCardHeader">
                        <div>
                          <span :class="$style.questionNumber">{{
                            answer.question_order
                          }}</span>
                        </div>
                        <div :class="$style.questionTextContainer">
                          <div :class="$style.questionText">
                            {{ answer.question_text }}
                            <span
                              v-if="answer.is_required"
                              :class="$style.requiredMark"
                              >*</span
                            >
                          </div>
                        </div>

                        <div :class="$style.questionMeta">
                          <div :class="$style.questionType">
                            <i
                              :class="getQuestionTypeIcon(answer.question_type)"
                            ></i>
                            <span>{{
                              getQuestionTypeLabel(answer.question_type)
                            }}</span>
                          </div>
                        </div>
                      </div>

                      <div :class="$style.answerValueContainer">
                        <div :class="$style.answerValueLabel">الإجابة:</div>

                        <!-- نعم/لا كبادج -->
                        <div v-if="isYesNo(answer)" :class="$style.answerValue">
                          <span
                            :class="[
                              $style.answerChip,
                              normalizeYesNo(answer) === 'نعم'
                                ? $style.yes
                                : $style.no,
                            ]"
                          >
                            <i
                              :class="
                                normalizeYesNo(answer) === 'نعم'
                                  ? 'fas fa-check'
                                  : 'fas fa-times'
                              "
                            ></i>
                            {{ normalizeYesNo(answer) }}
                          </span>
                        </div>

                        <!-- نص/اختيارات مع اختصار -->
                        <div v-else :class="$style.answerValue">
                          <div :class="$style.answerText">
                            {{ truncated(answer) }}
                          </div>
                          <button
                            v-if="needsClamp(answer)"
                            :class="$style.moreBtn"
                            @click="toggleExpand(answer.question_id)"
                          >
                            {{
                              isExpanded(answer.question_id)
                                ? "إظهار أقل"
                                : "إظهار المزيد"
                            }}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Pagination Controls -->
            <div
              v-if="!isLoading && responses.length > 0"
              :class="$style.paginationSection"
            >

              <div :class="$style.itemsPerPageControl">
                <label for="itemsPerPage">عرض</label>
                <select
                  id="itemsPerPage"
                  :class="$style.itemsPerPageSelect"
                  :value="itemsPerPage"
                  @change="
                    changeItemsPerPage(
                      Number(($event.target as HTMLSelectElement).value),
                    )
                  "
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                </select>
                <span>من</span>
                <span>{{ totalItems }}</span>
              </div>
              <div :class="$style.paginationControls">
                <button
                  :class="[
                    $style.paginationButton,
                    { [$style.disabled]: !hasPrevious },
                  ]"
                  @click="prevPage"
                  :disabled="!hasPrevious"
                >
                  <i class="fas fa-chevron-right"></i>
                  {{ t("survey.pagination.previous") }}
                </button>

                <div :class="$style.pageNumbers">
                  <template v-for="page in visiblePages" :key="page">
                    <span v-if="page === -1" :class="$style.ellipsis">...</span>
                    <button
                      v-else
                      :class="[
                        $style.pageButton,
                        { [$style.active]: page === currentPage },
                      ]"
                      @click="goToPage(page)"
                    >
                      {{ page }}
                    </button>
                  </template>
                </div>

                <button
                  :class="[
                    $style.paginationButton,
                    { [$style.disabled]: !hasNext },
                  ]"
                  @click="nextPage"
                  :disabled="!hasNext"
                >
                  {{ t("survey.pagination.next") }}
                  <i class="fas fa-chevron-left"></i>
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
      <!-- Analytics Dashboard Tab -->
      <div v-show="activeTab === 'analytics'" :class="$style.tabPanel2">
        <div v-if="analyticsLoading" :class="$style.loadingContainer">
          <div :class="$style.loadingSpinner"></div>
          <p :class="$style.loadingText">
            {{ t("survey.analytics.loadingAnalytics") }}
          </p>
        </div>

        <div v-else-if="analyticsError" :class="$style.errorContainer">
          <div :class="$style.errorIcon">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <h3 :class="$style.errorTitle">
            {{ t("survey.analytics.loadError") }}
          </h3>
          <p :class="$style.errorMessage">{{ analyticsError }}</p>
          <button @click="loadAnalytics" :class="$style.retryButton">
            <i class="fas fa-redo"></i>
            {{ t("common.retry") }}
          </button>
        </div>

        <div v-else-if="hasAnalyticsData">
          <SurveyAnalytics
            :analytics="surveyAnalytics"
            :loading="analyticsLoading"
            @refresh="loadAnalytics"
            @question-click="onAnalyticsQuestionClick"
            @period-click="onAnalyticsPeriodClick"
            @filters-change="onAnalyticsFiltersChange"
          />
        </div>

        <div v-else :class="$style.noDataContainer">
          <div :class="$style.noDataIcon">
            <i class="fas fa-chart-line"></i>
          </div>
          <h3 :class="$style.noDataTitle">
            {{ t("survey.analytics.noData") }}
          </h3>
          <p :class="$style.noDataMessage">
            {{ t("survey.analytics.noDataDescription") }}
          </p>
        </div>
      </div>

      <!-- Question Analytics Tab -->
      <div v-show="activeTab === 'questions'" :class="$style.tabPanel">
        <div v-if="analyticsLoading" :class="$style.loadingContainer">
          <div :class="$style.loadingSpinner"></div>
          <p :class="$style.loadingText">
            {{ t("survey.analytics.loadingAnalytics") }}
          </p>
        </div>

        <div v-else-if="analyticsError" :class="$style.errorContainer">
          <div :class="$style.errorIcon">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <h3 :class="$style.errorTitle">
            {{ t("survey.analytics.loadError") }}
          </h3>
          <p :class="$style.errorMessage">{{ analyticsError }}</p>
          <button @click="loadAnalytics" :class="$style.retryButton">
            <i class="fas fa-redo"></i>
            {{ t("common.retry") }}
          </button>
        </div>

        <div
          v-else-if="hasQuestionAnalyticsData"
          :class="$style.questionAnalyticsContent"
        >
          <div :class="$style.questionAnalyticsHeader">
            <h2 :class="$style.questionAnalyticsTitle">
              <i class="fas fa-question-circle"></i>
              {{ t("survey.analytics.questions") }}
            </h2>
            <p :class="$style.questionAnalyticsDescription">
              {{ t("survey.analytics.questionsDescription") }}
            </p>
          </div>

          <div :class="$style.questionAnalyticsGrid">
            <div
              v-for="question in normalizedQuestionAnalytics"
              :key="question.question_id"
              :class="$style.questionAnalyticsCard"
            >
              <div :class="$style.questionHeader">
                <div :class="$style.questionNumber">
                  Q{{ question.question_order }}
                </div>
                <div :class="$style.questionTitle">
                  {{ question.question_text }}
                </div>
                <div :class="$style.questionType">
                  <i :class="getQuestionTypeIcon(question.question_type)"></i>
                  {{ getQuestionTypeLabel(question.question_type) }}
                </div>
              </div>

              <div :class="$style.questionAnalyticsBody">
                <!-- Only render component if analytics data is valid -->
                <component
                  v-if="isValidQuestionAnalytics(question)"
                  :is="getQuestionAnalyticsComponent(question.question_type)"
                  :question="question"
                  :analytics="question"
                  :detailed="true"
                />
                <div v-else :class="$style.noQuestionData">
                  <div :class="$style.noQuestionDataIcon">
                    <i class="fas fa-chart-line"></i>
                  </div>
                  <p :class="$style.noQuestionDataText">
                    {{ t("survey.analytics.noDataForQuestion") }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else :class="$style.noDataContainer">
          <div :class="$style.noDataIcon">
            <i class="fas fa-question-circle"></i>
          </div>
          <h3 :class="$style.noDataTitle">
            {{ t("survey.analytics.noQuestionData") }}
          </h3>
          <p :class="$style.noDataMessage">
            {{ t("survey.analytics.noQuestionDataDescription") }}
          </p>
        </div>
      </div>

      <!-- Format Selection Modal -->
      <div
        v-if="showFormatModal"
        :class="$style.modalOverlay"
        @click="showFormatModal = false"
      >
        <div :class="$style.formatModal" @click.stop>
          <div :class="$style.modalHeader">
              <button :class="$style.modalClose" @click="showFormatModal = false">
              <i class="fas fa-times"></i>
            </button>
            <h3 :class="$style.modalTitle">
              <i class="fas fa-file-export"></i>
              اختر صيغة التصدير
            </h3>
          
          </div>

          <div :class="$style.modalContent">
            <p :class="$style.formatDescription">
              اختر الصيغة المناسبة لتصدير جميع استجابات الاستبيان
            </p>

            <div :class="$style.formatOptions">
              <div
                :class="[
                  $style.formatOption,
                  { [$style.selected]: selectedFormat === 'excel' },
                ]"
                @click="selectFormatAndDownload('excel')"
              >
                <div :class="$style.formatIcon">
                  <i class="fas fa-file-excel" style="color: #217346"></i>
                </div>
                <div :class="$style.formatInfo">
                  <h4 :class="$style.formatTitle">Excel</h4>
                  <p :class="$style.formatDesc">
                    جداول منظمة مع إمكانية التحليل والفرز
                  </p>
                </div>
              </div>

              <div
                :class="[
                  $style.formatOption,
                  { [$style.selected]: selectedFormat === 'csv' },
                ]"
                @click="selectFormatAndDownload('csv')"
              >
                <div :class="$style.formatIcon">
                  <i class="fas fa-file-csv" style="color: #10793f"></i>
                </div>
                <div :class="$style.formatInfo">
                  <h4 :class="$style.formatTitle">CSV</h4>
                  <p :class="$style.formatDesc">
                    بيانات خام متوافقة مع جميع البرامج
                  </p>
                </div>
              </div>

              <!-- PDF export - Hidden for next release -->
              <div
                :class="[
                  $style.formatOption,
                  { [$style.selected]: selectedFormat === 'pdf' },
                ]"
                @click="selectFormatAndDownload('pdf')"
              >
                <div :class="$style.formatIcon">
                  <i class="fas fa-file-pdf" style="color: #d32f2f"></i>
                </div>
                <div :class="$style.formatInfo">
                  <h4 :class="$style.formatTitle">PDF</h4>
                  <p :class="$style.formatDesc">تقرير منسق وجاهز للطباعة</p>
                </div>
              </div>

              <div
                :class="[
                  $style.formatOption,
                  { [$style.selected]: selectedFormat === 'word' },
                ]"
                @click="selectFormatAndDownload('word')"
              >
                <div :class="$style.formatIcon">
                  <i class="fas fa-file-word" style="color: #2b579a"></i>
                </div>
                <div :class="$style.formatInfo">
                  <h4 :class="$style.formatTitle">Word</h4>
                  <p :class="$style.formatDesc">مستند قابل للتحرير والتخصيص</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Export Modal -->
      <div
        v-if="showExportModal"
        :class="$style.modalOverlay"
        @click="showExportModal = false"
      >
        <div :class="$style.exportModal" @click.stop>
          <div :class="$style.modalHeader">
            <h3 :class="$style.modalTitle">
              <i class="fas fa-download"></i>
              {{ t("survey.responses.exportTitle") }}
            </h3>
            <button :class="$style.modalClose" @click="showExportModal = false">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <div :class="$style.modalContent">
            <div :class="$style.exportOptions">
              <div
                :class="[
                  $style.exportOption,
                  { [$style.selected]: selectedExportFormat === 'csv' },
                ]"
                @click="selectedExportFormat = 'csv'"
              >
                <i class="fas fa-file-csv"></i>
                <span>{{ t("survey.responses.exportOptions.csv") }}</span>
                <p>{{ t("survey.responses.exportOptions.csvDescription") }}</p>
              </div>

              <div
                :class="[
                  $style.exportOption,
                  { [$style.selected]: selectedExportFormat === 'json' },
                ]"
                @click="selectedExportFormat = 'json'"
              >
                <i class="fas fa-file-code"></i>
                <span>{{ t("survey.responses.exportOptions.json") }}</span>
                <p>{{ t("survey.responses.exportOptions.jsonDescription") }}</p>
              </div>
            </div>

            <div :class="$style.exportSettings">
              <label :class="$style.checkboxLabel">
                <input type="checkbox" v-model="includeIncomplete" />
                <span>{{
                  t("survey.responses.exportOptions.includeIncomplete")
                }}</span>
              </label>
            </div>
          </div>

          <div :class="$style.modalActions">
            <button
              :class="$style.cancelButton"
              @click="showExportModal = false"
            >
              {{ t("common.cancel") }}
            </button>
            <button
              :class="$style.exportConfirmButton"
              @click="performExport"
              :disabled="isExporting"
            >
              <i v-if="isExporting" class="fas fa-spinner fa-spin"></i>
              <i v-else class="fas fa-download"></i>
              {{
                isExporting
                  ? t("survey.responses.exporting")
                  : t("survey.responses.exportOptions.confirm")
              }}
            </button>
          </div>
        </div>
      </div>

      <!-- Response Details Modal -->
      <div
        v-if="selectedResponse"
        :class="$style.modalOverlay"
        @click="selectedResponse = null"
      >
        <div :class="$style.detailsModal" @click.stop>
          <div :class="$style.modalHeader">
            <h3 :class="$style.modalTitle">
              <i class="fas fa-clipboard-list"></i>
              {{ t("survey.responses.responseDetails") }}
            </h3>
            <button :class="$style.modalClose" @click="selectedResponse = null">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <div :class="$style.modalContent">
            <div :class="$style.responseMetadata">
              <div :class="$style.metadataGrid">
                <div :class="$style.metadataItem">
                  <span :class="$style.metadataLabel"
                    >{{ t("survey.responses.respondent") }}:</span
                  >
                  <span :class="$style.metadataValue">{{
                    selectedResponse.respondent.email ||
                    t("survey.responses.anonymousUser")
                  }}</span>
                </div>
                <div :class="$style.metadataItem">
                  <span :class="$style.metadataLabel"
                    >{{ t("survey.responses.submittedAt") }}:</span
                  >
                  <span :class="$style.metadataValue">{{
                    formatDate(selectedResponse.submitted_at)
                  }}</span>
                </div>
                <div :class="$style.metadataItem">
                  <span :class="$style.metadataLabel"
                    >{{ t("survey.responses.status") }}:</span
                  >
                  <span
                    :class="[
                      $style.metadataValue,
                      $style.statusBadge,
                      selectedResponse.is_complete
                        ? $style.complete
                        : $style.incomplete,
                    ]"
                  >
                    {{
                      selectedResponse.is_complete
                        ? t("survey.responses.completed")
                        : t("survey.responses.incomplete")
                    }}
                  </span>
                </div>
                <div :class="$style.metadataItem">
                  <span :class="$style.metadataLabel"
                    >{{ t("survey.responses.ipAddress") }}:</span
                  >
                  <span :class="$style.metadataValue">{{
                    selectedResponse.ip_address || t("common.notAvailable")
                  }}</span>
                </div>
              </div>
            </div>

            <div :class="$style.answersContainer">
              <h4 :class="$style.answersTitle">
                {{ t("survey.responses.answers") }}
              </h4>
              <div
                v-for="answer in selectedResponse.answers"
                :key="answer.question_id"
                :class="$style.answerDetailItem"
              >
                <div :class="$style.questionHeader">
                  <span :class="$style.questionNumber">{{
                    answer.question_order
                  }}</span>
                  <span :class="$style.questionText">{{
                    answer.question_text
                  }}</span>
                  <span v-if="answer.is_required" :class="$style.requiredMark"
                    >*</span
                  >
                </div>
                <div :class="$style.questionMeta">
                  <span :class="$style.questionType">
                    <i :class="getQuestionTypeIcon(answer.question_type)"></i>
                    {{ getQuestionTypeLabel(answer.question_type) }}
                  </span>
                </div>
                <div :class="$style.answerValue">
                  {{ formatAnswer(answer) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAppStore } from "../../stores/useAppStore";
import { apiClient } from "../../services/jwtAuthService";
import Swal from "sweetalert2";
import jsPDF from "jspdf";
import { addAmiriFont } from "../../lib/fonts/Amiri-normal";

// Analytics Components
import SurveyAnalytics from "../../components/Analytics/SurveyAnalytics.vue";
import SingleChoiceAnalytics from "../../components/Analytics/SingleChoiceAnalytics.vue";
import MultipleChoiceAnalytics from "../../components/Analytics/MultipleChoiceAnalytics.vue";
import RatingAnalytics from "../../components/Analytics/RatingAnalytics.vue";
import YesNoAnalytics from "../../components/Analytics/YesNoAnalytics.vue";
import TextAnalytics from "../../components/Analytics/TextAnalytics.vue";

import { reshape } from "arabic-persian-reshaper";


// Props
interface Props {
  surveyId?: string;
}
const props = defineProps<Props>();

// Router
const route = useRoute();
const router = useRouter();

// Store
const store = useAppStore();

// Computed
const currentTheme = computed(() => store.currentTheme);
const isRTL = computed(() => store.currentLanguage === "ar");
const t = computed(() => store.t);

// Clean Unicode direction markers that cause display issues in PDF
function cleanDirectionMarkers(text: string): string {
  if (!text) return text;
  // Remove all Unicode direction markers
  return text
    .replace(/[\u200E\u200F\u202A\u202B\u202C\u202D\u202E\u2066\u2067\u2068\u2069]/g, '')
    .trim();
}

function shapeArabicText(text: string, rtl: boolean): string {
  if (!rtl || !text) return text;
  try {
    // Clean direction markers first
    const cleaned = cleanDirectionMarkers(text);
    // تشكيل وربط الحروف
    const shaped = reshape(cleaned);
    // jsPDF يرسم من اليسار إلى اليمين دائماً، لذا نقلب الترتيب بعد التشكيل
    return shaped.split('').reverse().join('');
  } catch (e) {
    console.warn("Arabic shaping error:", e);
    return text;
  }
}

const ARABIC_DIGIT_MAP: Record<string, string> = {
  "0": "٠",
  "1": "١",
  "2": "٢",
  "3": "٣",
  "4": "٤",
  "5": "٥",
  "6": "٦",
  "7": "٧",
  "8": "٨",
  "9": "٩",
};

// Dynamic PDF colors based on theme
const getPdfColors = (theme: string) => {
  // Light theme colors (matching design-tokens.css)
  const lightTheme = {
    primary: "#A17D23",        // --color-gold-700 (main gold)
    primaryLight: "#CEA55B",   // --color-gold-500 (lighter gold)
    secondary: "#231F20",      // --color-gray-900 (dark gray)
    subtitle: "#4D4D4F",       // --color-gray-700 (medium gray)
    text: "#231F20",           // --color-gray-900 (primary text)
    textMuted: "#808285",      // --color-gray-500 (muted text)
    border: "#E5E8E1",         // --color-gray-100 (light border)
    light: "#F8F9FA",          // Light surface
    surface: "#FFFFFF",        // White background
    accent: "#D8CFBB",         // --color-beige-300 (beige accent)
  };

  // Dark theme colors
  const darkTheme = {
    primary: "#CEA55B",        // Lighter gold for dark background
    primaryLight: "#D3B079",   // --color-gold-400
    secondary: "#E5E8E1",      // Light gray for dark bg
    subtitle: "#A5A5A5",       // Muted gray
    text: "#E5E8E1",           // Light text
    textMuted: "#A5A5A5",      // Muted light text
    border: "#4D4D4F",         // Dark border
    light: "#1F1F1F",          // Dark surface
    surface: "#141414",        // Dark background
    accent: "#2A2A2A",         // Dark accent
  };

  return theme === "light" ? lightTheme : darkTheme;
};

// Unicode direction markers (not used in PDF rendering to avoid display issues)
// const LRM = "\u200E"; // Left-to-Right Mark
// const RLM = "\u200F"; // Right-to-Left Mark
// const RLI = "\u2067"; // Right-to-Left Isolate
// const PDI = "\u2069"; // Pop Directional Isolate

function isArabicLine(s: string): boolean {
  return /[\u0600-\u06FF]/.test(String(s || ""));
}

// Not used in PDF rendering - direction markers cause display issues
// function protectLTRSegments(s: string): string {
//   if (!s) return "";
//   const RLI = "\u2067";
//   const PDI = "\u2069";
//   return String(s)
//     .replace(/([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/g, m => `${RLI}${m}${PDI}`)
//     .replace(/(https?:\/\/\S+|www\.\S+)/g, m => `${RLI}${m}${PDI}`)
//     .replace(/\b[0-9][0-9A-Za-z\-_.:/]*\b/g, m => `${RLI}${m}${PDI}`);
// }

// const asLTR = (s: string) => {
//   const RLI = "\u2067";
//   const PDI = "\u2069";
//   return `${RLI}${s}${PDI}`;
// };

const localizeDigits = (value: string, rtl: boolean) =>
  rtl ? value.replace(/[0-9]/g, (digit) => ARABIC_DIGIT_MAP[digit] ?? digit) : value;

const formatWithDigits = (
  value: number | string,
  formatter: Intl.NumberFormat,
  rtl: boolean,
) => {
  if (typeof value === "number") {
    return localizeDigits(formatter.format(value), rtl);
  }

  const numeric = Number(value);
  if (!Number.isNaN(numeric)) {
    return localizeDigits(formatter.format(numeric), rtl);
  }

  return localizeDigits(String(value ?? ""), rtl);
};

const drawText = (
  pdf: jsPDF,
  text: string,
  x: number,
  y: number,
  options: {
    rtl: boolean;
    size?: number;
    weight?: "normal" | "bold";
    color?: string;
    align?: "left" | "right" | "center";
  },
) => {
  const { rtl, size = 12, weight = "normal", color = "#231F20" } =
    options;
  const align = options.align ?? (rtl ? "right" : "left");

  const base = text ?? "";
  const localized = rtl ? localizeDigits(base, true) : base;
  const lineHasArabic = isArabicLine(localized);
  
  // For PDF rendering, we don't need direction markers
  // They cause display issues - clean text works better
  const cleaned = cleanDirectionMarkers(localized);
  
  // For Arabic text: reshape + reverse, then render as LTR
  // This gives us full control over the text rendering
  const shaped = shapeArabicText(cleaned, rtl && lineHasArabic);

  const fontWeight = weight === "bold" ? "bold" : "normal";

  pdf.setFont("Amiri", fontWeight);
  pdf.setFontSize(size);
  pdf.setTextColor(color);
  
  // When text is reshaped and reversed, we render it as LTR
  // This prevents double reversal by jsPDF
  pdf.text(shaped, x, y, {
    align,
    isInputRtl: false, // Always false because we handle reversal in shapeArabicText
  });
};

const drawParagraph = (
  pdf: jsPDF,
  text: string,
  x: number,
  y: number,
  width: number,
  options: {
    rtl: boolean;
    size?: number;
    weight?: "normal" | "bold";
    color?: string;
    lineHeight?: number;
    align?: "left" | "right" | "center";
  },
) => {
  const { rtl, lineHeight = 5.5 } = options;
  const base = text ?? "";
  const localized = rtl ? localizeDigits(base, true) : base;
  const lines = pdf.splitTextToSize(localized, width);
  let cursorY = y;

  lines.forEach((line: string) => {
    const lineHasArabic = isArabicLine(line);
    drawText(pdf, line, x, cursorY, {
      ...options,
      rtl: rtl && lineHasArabic,
    });
    cursorY += lineHeight;
  });

  return cursorY;
};


const expanded = ref<Set<string | number>>(new Set());

const isYesNo = (a: any) => {
  const raw = (a?.raw_value ?? a?.answer_text ?? "")
    .toString()
    .trim()
    .toLowerCase();
  return ["نعم", "لا", "yes", "no", "true", "false", "1", "0"].includes(raw);
};

const normalizeYesNo = (a: any) => {
  const raw = (a?.raw_value ?? a?.answer_text ?? "")
    .toString()
    .trim()
    .toLowerCase();
  if (["نعم", "yes", "true", "1"].includes(raw)) return "نعم";
  return "لا";
};

const needsClamp = (a: any) => {
  const text = formatAnswer(a) || "";
  return !expanded.value.has(a.question_id) && text.length > 180;
};

const truncated = (a: any) => {
  const text = formatAnswer(a) || "—";
  if (expanded.value.has(a.question_id)) return text;
  return text.length > 180 ? text.slice(0, 180) + "…" : text;
};

const toggleExpand = (id: string | number) => {
  const e = new Set(expanded.value);
  if (e.has(id)) {
    e.delete(id);
  } else {
    e.add(id);
  }
  expanded.value = e;
};

const isExpanded = (id: string | number) => expanded.value.has(id);

// State
const survey = ref<any>(null);
const responses = ref<any[]>([]);
const isLoading = ref(false);
const searchQuery = ref("");
const completionFilter = ref("all");
const respondentFilter = ref("all");
const sortOrder = ref("-submitted_at");
const startDate = ref("");
const endDate = ref("");
const expandedResponse = ref<string | null>(null);
const selectedResponse = ref<any>(null);

// Pagination state
const currentPage = ref(1);
const itemsPerPage = ref(10);
const totalItems = ref(0);
const totalPages = computed(() =>
  Math.ceil(totalItems.value / itemsPerPage.value),
);

// Export modal state
const showExportModal = ref(false);
const showFormatModal = ref(false);
const selectedExportFormat = ref("csv");
const selectedFormat = ref<"excel" | "csv" | "pdf" | "word">("csv");
const includeIncomplete = ref(true);
const isExporting = ref(false);

// Get survey ID from route or props (must be defined before using it)
const surveyId = computed(
  () => props.surveyId || (route.params.surveyId as string),
);

// Analytics state
// Restore active tab from localStorage or default to "responses"
const getStoredTab = () => {
  const storedTab = localStorage.getItem(`survey_${surveyId.value}_activeTab`);
  return storedTab === "analytics" || storedTab === "questions" ? storedTab : "responses";
};
const activeTab = ref(getStoredTab());
const analyticsLoading = ref(false);
const analyticsError = ref<string | null>(null);
const surveyAnalytics = ref<any>(null);
const questionAnalytics = ref<any[]>([]);
const analyticsLoadingPromise = ref<Promise<void> | null>(null); // Track loading promise
// Guards to prevent recursive updates from child emissions
const isProgrammaticAnalyticsUpdate = ref(false);
const lastAnalyticsFiltersKey = ref<string>("");
const isHandlingAnalyticsFilters = ref(false);

// Computed values
// Keeping this computed value as it might be used elsewhere in the component
// @ts-ignore - This is used in the template
const completedResponses = computed(
  () => responses.value.filter((response) => response.is_complete).length,
);

// Computed property to check if analytics data is ready to display
const hasAnalyticsData = computed(() => {
  // Only show data if we're not loading and have valid data
  return (
    !analyticsLoading.value &&
    !!(
      surveyAnalytics.value &&
      (surveyAnalytics.value.data || surveyAnalytics.value.status === "success")
    )
  );
});

const hasQuestionAnalyticsData = computed(() => {
  // Only show data if we're not loading and have valid data
  return (
    !analyticsLoading.value &&
    !!(questionAnalytics.value && questionAnalytics.value.length > 0)
  );
});

// Pagination computed properties
const hasPrevious = computed(() => currentPage.value > 1);
const hasNext = computed(() => currentPage.value < totalPages.value);
const visiblePages = computed(() => {
  const pages = [];
  const total = totalPages.value;
  const current = currentPage.value;

  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push(i);
    }
  } else {
    if (current <= 4) {
      for (let i = 1; i <= 5; i++) {
        pages.push(i);
      }
      pages.push(-1); // ellipsis
      pages.push(total);
    } else if (current >= total - 3) {
      pages.push(1);
      pages.push(-1); // ellipsis
      for (let i = total - 4; i <= total; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      pages.push(-1); // ellipsis
      for (let i = current - 1; i <= current + 1; i++) {
        pages.push(i);
      }
      pages.push(-1); // ellipsis
      pages.push(total);
    }
  }

  return pages;
});

// Watchers to reset pagination when filters change
watch(
  [
    searchQuery,
    completionFilter,
    respondentFilter,
    sortOrder,
    startDate,
    endDate,
  ],
  () => {
    currentPage.value = 1;
    loadSurveyResponses();
  },
);

// Watch activeTab to save to localStorage
watch(activeTab, (newTab) => {
  localStorage.setItem(`survey_${surveyId.value}_activeTab`, newTab);
});

// Removed unused computed property

// Methods
const loadSurveyResponses = async () => {
  try {
    isLoading.value = true;

    const params = new URLSearchParams();

    // Add pagination parameters
    params.append("page", currentPage.value.toString());
    params.append("per_page", itemsPerPage.value.toString());

    if (completionFilter.value !== "all") {
      params.append(
        "is_complete",
        completionFilter.value === "complete" ? "true" : "false",
      );
    }
    if (respondentFilter.value !== "all") {
      params.append("respondent_type", respondentFilter.value);
    }
    if (searchQuery.value) {
      params.append("search", searchQuery.value);
    }
    if (startDate.value) {
      params.append("start_date", startDate.value + "T00:00:00Z");
    }
    if (endDate.value) {
      params.append("end_date", endDate.value + "T23:59:59Z");
    }
    if (sortOrder.value) {
      params.append("ordering", sortOrder.value);
    }

    const response = await apiClient.get(
      `/surveys/admin/surveys/${surveyId.value}/responses/?${params.toString()}`,
    );

    // Handle the actual API response structure
    if (response.data) {
      // Check if data is nested (response.data.data) or direct (response.data)
      const dataContainer = response.data.data || response.data;

      // Extract survey data from the response
      survey.value = dataContainer.survey;

      // Extract responses from the paginated results
      responses.value = dataContainer.results || [];

      // Update pagination data
      totalItems.value = dataContainer.count || 0;
    } else {
      throw new Error("Invalid response format");
    }
  } catch (error) {
    // Logging removed for production

    // Fallback to empty state on error
    survey.value = {
      id: surveyId.value,
      title: "Survey Title",
      description: "Survey Description",
      total_responses: 0,
      total_questions: 0,
    };

    responses.value = [];
    totalItems.value = 0;
  } finally {
    isLoading.value = false;
  }
};

// ...existing code...

// Pagination methods
const prevPage = () => {
  if (hasPrevious.value) {
    currentPage.value--;
    loadSurveyResponses();
  }
};

const nextPage = () => {
  if (hasNext.value) {
    currentPage.value++;
    loadSurveyResponses();
  }
};

const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value && page !== currentPage.value) {
    currentPage.value = page;
    loadSurveyResponses();
  }
};

const changeItemsPerPage = (newItemsPerPage: number) => {
  itemsPerPage.value = newItemsPerPage;
  currentPage.value = 1;
  loadSurveyResponses();
};

const expandResponse = (responseId: string) => {
  expandedResponse.value =
    expandedResponse.value === responseId ? null : responseId;
};

const performExport = async () => {
  try {
    isExporting.value = true;

    const params = new URLSearchParams();
    params.append("format", selectedExportFormat.value);

    if (!includeIncomplete.value) {
      params.append("is_complete", "true");
    }

    // Add current filters
    if (completionFilter.value !== "all") {
      params.append(
        "is_complete",
        completionFilter.value === "complete" ? "true" : "false",
      );
    }
    if (respondentFilter.value !== "all") {
      params.append("respondent_type", respondentFilter.value);
    }
    if (searchQuery.value) {
      params.append("search", searchQuery.value);
    }
    if (startDate.value) {
      params.append("start_date", startDate.value + "T00:00:00Z");
    }
    if (endDate.value) {
      params.append("end_date", endDate.value + "T23:59:59Z");
    }
    if (sortOrder.value) {
      params.append("ordering", sortOrder.value);
    }

    const response = await apiClient.get(
      `/surveys/admin/surveys/${surveyId.value}/responses/export/?${params.toString()}`,
      {
        responseType: "blob",
      },
    );

    if (response.status === 200) {
      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      const filename = `survey_${surveyId.value}_responses.${selectedExportFormat.value}`;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showExportModal.value = false;
    } else {
      throw new Error("Export failed");
    }
  } catch (error) {
    // Logging removed for production
    Swal.fire({
      title: "خطأ في التصدير",
      text: "فشل في تصدير البيانات",
      icon: "error",
      confirmButtonText: "موافق",
    });
  } finally {
    isExporting.value = false;
  }
};

// Main function to select format and download
const selectFormatAndDownload = async (
  format: "excel" | "csv" | "pdf" | "word",
) => {
  selectedFormat.value = format;
  showFormatModal.value = false;

  try {
    isExporting.value = true;

    // Fetch ALL responses using the direct endpoint
    const response = await apiClient.get(
      `/surveys/admin/surveys/${surveyId.value}/responses/?ordering=-submitted_at`,
    );

    // Extract responses from the API response
    let allResponses: any[] = [];
    if (response.data) {
      const dataContainer = response.data.data || response.data;
      allResponses = dataContainer.results || dataContainer || [];
    }

    if (allResponses.length === 0) {
      Swal.fire({
        title: "لا توجد بيانات",
        text: "لا توجد استجابات لتصديرها",
        icon: "info",
        confirmButtonText: "موافق",
      });
      return;
    }

    // Generate content based on format
    switch (format) {
      case "excel":
        await downloadAsExcel(allResponses);
        break;
      case "csv":
        await downloadAsCSV(allResponses);
        break;
      case "pdf":
        await downloadAsPDF(allResponses);
        break;
      case "word":
        await downloadAsWord(allResponses);
        break;
    }

    Swal.fire({
      title: "تم التصدير بنجاح",
      text: `تم تحميل ${allResponses.length} استجابة بصيغة ${getFormatName(format)}`,
      icon: "success",
      confirmButtonText: "موافق",
    });
  } catch (error) {
    console.error("Export error:", error);
    Swal.fire({
      title: "خطأ في التصدير",
      text: "فشل في تحميل الاستجابات",
      icon: "error",
      confirmButtonText: "موافق",
    });
  } finally {
    isExporting.value = false;
  }
};

// Get format display name
const getFormatName = (format: string) => {
  const names: Record<string, string> = {
    excel: "Excel",
    csv: "CSV",
    pdf: "PDF",
    word: "Word",
  };
  return names[format] || format;
};

// Download as CSV
const downloadAsCSV = async (responses: any[]) => {
  const csvContent = generateArabicCSV(responses);
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  downloadFile(blob, `استجابات_الاستبيان_${surveyId.value}.csv`);
};

// Download as Excel (using CSV format but with .xls extension for simplicity)
const downloadAsExcel = async (responses: any[]) => {
  // For a basic implementation, we'll use CSV with BOM which Excel handles well
  // For advanced Excel features, you'd need a library like xlsx
  const csvContent = generateArabicCSV(responses);
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], {
    type: "application/vnd.ms-excel;charset=utf-8;",
  });
  downloadFile(blob, `استجابات_الاستبيان_${surveyId.value}.xls`);
};

// Download as PDF with website theme colors
const downloadAsPDF = async (responses: any[]) => {
  try {
    const rtl = isRTL.value;
    const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    
    // Add and set Amiri font for Arabic support
    addAmiriFont(pdf);
    pdf.setFont("Amiri", "normal");
    
    // Get theme-based colors for PDF
    const theme = currentTheme.value;
    const pdfColors = getPdfColors(theme);
    
    const locale = rtl ? 'ar-SA' : 'en-US';
    const numberFormatter = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });

    const formatDateForPdf = (value?: string) => {
      if (!value) return '';
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return '';
      
      if (rtl) {
        // Format manually for Arabic to avoid Unicode markers
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        
        // Format as: YYYY/MM/DD HH:MM:SS and convert to Arabic numerals
        const formatted = `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
        return localizeDigits(formatted, true);
      } else {
        return date.toLocaleString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
      }
    };

    const strings = {
      reportTitle: rtl ? 'تقرير استجابات الاستبيان' : 'Survey Responses Report',
      answersTitle: rtl ? 'الإجابات' : 'Answers',
      respondent: rtl ? 'المستجيب' : 'Respondent',
      respondentType: rtl ? 'نوع المستجيب' : 'Respondent type',
      status: rtl ? 'الحالة' : 'Status',
      completionRate: rtl ? 'نسبة الإكمال' : 'Completion rate',
      anonymousRespondent: rtl ? 'مستجيب مجهول' : 'Anonymous respondent',
      registeredUser: rtl ? 'مستخدم مسجل' : 'Registered user',
      anonymousUser: rtl ? 'مستخدم مجهول' : 'Anonymous user',
      completed: rtl ? 'مكتملة' : 'Completed',
      incomplete: rtl ? 'غير مكتملة' : 'Incomplete',
      questionLabel: rtl ? 'السؤال' : 'Question',
      questionType: rtl ? 'نوع السؤال' : 'Question type',
      noQuestionText: rtl ? 'لا يوجد نص للسؤال' : 'No question text',
      noAnswer: rtl ? 'لا توجد إجابة' : 'No answer provided',
      noAnswersAvailable: rtl ? 'لا توجد إجابات متاحة' : 'No answers available',
      pageIndicator: rtl ? 'صفحة' : 'Page',
      ofIndicator: rtl ? 'من' : 'of',
    };

    const localizedCount = formatWithDigits(responses.length, numberFormatter, rtl);
    const exportTimestamp = formatDateForPdf(new Date().toISOString());

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 18;
    const contentWidth = pageWidth - margin * 2;
    let yPosition = margin;

    const ensureSpace = (height: number) => {
      if (yPosition + height > pageHeight - margin) {
        pdf.addPage();
        pdf.setFont('Amiri', 'normal');
        yPosition = margin;
      }
    };

    pdf.setFillColor(pdfColors.primary);
    pdf.roundedRect(margin, yPosition, contentWidth, 30, 4, 4, 'F');
    const reportTitleRtl = isArabicLine(strings.reportTitle);
    drawText(pdf, strings.reportTitle, pageWidth / 2, yPosition + 12, {
      rtl: reportTitleRtl,
      size: 18,
      weight: 'bold',
      color: '#FFFFFF', // White text on primary background
      align: 'center',
    });
    const subtitle = rtl
      ? `عدد الاستجابات: ${localizedCount} | تاريخ التصدير: ${exportTimestamp}`
      : `Responses: ${localizedCount} | Exported on: ${exportTimestamp}`;
    const subtitleRtl = isArabicLine(subtitle);
    drawText(pdf, subtitle, pageWidth / 2, yPosition + 23, {
      rtl: subtitleRtl,
      size: 11,
      color: '#FFFFFF', // White text on primary background
      align: 'center',
    });
    yPosition += 42;

    responses.forEach((response, index) => {
      ensureSpace(24);

      pdf.setFillColor(pdfColors.light);
      pdf.roundedRect(margin, yPosition, contentWidth, 12, 3, 3, 'F');
      const responseOrder = formatWithDigits(index + 1, numberFormatter, rtl);
      const submittedAt = formatDateForPdf(response?.submitted_at);
      const headingPrefix = rtl ? 'الاستجابة رقم' : 'Response #';
      const heading = rtl
        ? (submittedAt ? `${headingPrefix} ${responseOrder} - ${submittedAt}` : `${headingPrefix} ${responseOrder}`)
        : (submittedAt ? `${headingPrefix} ${responseOrder} - ${submittedAt}` : `${headingPrefix} ${responseOrder}`);
      const headingRtl = isArabicLine(heading);
      const headingX = headingRtl ? pageWidth - margin - 6 : margin + 6;
      drawText(pdf, heading, headingX, yPosition + 8, {
        rtl: headingRtl,
        size: 13,
        weight: 'bold',
        color: pdfColors.primary,
      });
      yPosition += 18;

      const infoRows = [
        {
          label: strings.respondent,
          value: response?.respondent?.email || strings.anonymousRespondent,
        },
        {
          label: strings.respondentType,
          value:
            response?.respondent?.type === 'authenticated'
              ? strings.registeredUser
              : strings.anonymousUser,
        },
        {
          label: strings.status,
          value: response?.is_complete ? strings.completed : strings.incomplete,
        },
        {
          label: strings.completionRate,
          value: `${formatWithDigits(getCompletionPercentage(response), numberFormatter, rtl)}%`,
        },
      ];

      infoRows.forEach(({ label, value }) => {
        ensureSpace(10);
        const rawValue = typeof value === 'string' ? value : String(value ?? '');
        const valueHasArabic = isArabicLine(rawValue);
        const labelHasArabic = isArabicLine(label);
        
        // Determine if the whole line should be RTL (when both label and value are Arabic)
        const lineRtl = rtl && labelHasArabic && valueHasArabic;
        
        // Simple formatting without direction markers
        const fullLine = `${label}: ${rawValue}`;
        const anchorX = lineRtl ? pageWidth - margin : margin;
        
        yPosition = drawParagraph(
          pdf,
          fullLine,
          anchorX,
          yPosition,
          contentWidth,
          {
            rtl: lineRtl,
            size: 11,
            color: pdfColors.subtitle,
            lineHeight: 6,
          },
        ) + 2;
      });

      ensureSpace(12);
      const answersTitleRtl = isArabicLine(strings.answersTitle);
      drawText(pdf, strings.answersTitle, answersTitleRtl ? pageWidth - margin : margin, yPosition + 8, {
        rtl: answersTitleRtl,
        size: 12,
        weight: 'bold',
        color: pdfColors.primary,
      });
      yPosition += 16;

      const answers = Array.isArray(response?.answers) ? response.answers : [];

      if (answers.length === 0) {
        ensureSpace(12);
        const noAnswersRtl = rtl && isArabicLine(strings.noAnswersAvailable);
        yPosition = drawParagraph(
          pdf,
          strings.noAnswersAvailable,
          noAnswersRtl ? pageWidth - margin : margin,
          yPosition,
          contentWidth,
          {
            rtl: noAnswersRtl,
            size: 11,
            color: pdfColors.subtitle,
            lineHeight: 6,
          },
        ) + 6;
      } else {
        answers.forEach((answer: any, answerIndex: number) => {
          ensureSpace(24);
          if (!answer) return;
          const displayOrder = formatWithDigits(
            answer?.question_order ?? answerIndex + 1,
            numberFormatter,
            rtl,
          );
          const questionHeading = rtl
            ? `${strings.questionLabel} ${displayOrder}`
            : `${strings.questionLabel} ${displayOrder}`;
          const questionHeadingRtl = rtl && isArabicLine(questionHeading);
          drawText(
            pdf,
            questionHeading,
            questionHeadingRtl ? pageWidth - margin : margin,
            yPosition + 5,
            {
              rtl: questionHeadingRtl,
              size: 11,
              weight: 'bold',
              color: pdfColors.secondary,
            },
          );
          yPosition += 10;

          const questionText = answer?.question_text || strings.noQuestionText;
          const questionTextRtl = rtl && isArabicLine(questionText);
          yPosition = drawParagraph(
            pdf,
            questionText,
            questionTextRtl ? pageWidth - margin : margin,
            yPosition,
            contentWidth,
            {
              rtl: questionTextRtl,
              size: 11,
              color: pdfColors.secondary,
              lineHeight: 5.5,
            },
          ) + 2;

          const questionTypeLabel = `${strings.questionType}: ${getQuestionTypeLabel(
            answer?.question_type,
          )}`;
          const questionTypeRtl = rtl && isArabicLine(questionTypeLabel);
          yPosition = drawParagraph(
            pdf,
            questionTypeLabel,
            questionTypeRtl ? pageWidth - margin : margin,
            yPosition,
            contentWidth,
            {
              rtl: questionTypeRtl,
              size: 9.5,
              color: pdfColors.subtitle,
              lineHeight: 5.2,
            },
          ) + 4;

          const answerValue = formatAnswerForCSV(answer) || strings.noAnswer;
          const answerValueHasArabic = isArabicLine(answerValue);
          const answerValueRtl = rtl && answerValueHasArabic;
          ensureSpace(16);
          pdf.setFillColor(pdfColors.light);
          pdf.roundedRect(margin, yPosition, contentWidth, 12, 2, 2, 'F');
          yPosition = drawParagraph(
            pdf,
            answerValue,
            answerValueRtl ? pageWidth - margin - 4 : margin + 4,
            yPosition + 5,
            contentWidth - 8,
            {
              rtl: answerValueRtl,
              size: 11,
              color: pdfColors.secondary,
              lineHeight: 5.5,
            },
          ) + 6;
        });
      }

      yPosition += 6;

      if (index < responses.length - 1) {
        ensureSpace(8);
        pdf.setDrawColor(pdfColors.border);
        pdf.setLineWidth(0.2);
        pdf.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 10;
      }
    });

    const totalPages = (pdf as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      const pageNum = formatWithDigits(i, numberFormatter, rtl);
      const totalPagesNum = formatWithDigits(totalPages, numberFormatter, rtl);
      const label = rtl 
        ? `${totalPagesNum} ${strings.ofIndicator} ${pageNum} ${strings.pageIndicator}`
        : `${strings.pageIndicator} ${pageNum} ${strings.ofIndicator} ${totalPagesNum}`;
      const footerRtl = rtl && isArabicLine(label);
      drawText(pdf, label, pageWidth / 2, pageHeight - 12, {
        rtl: footerRtl,
        size: 9,
        color: pdfColors.subtitle,
        align: 'center',
      });
    }

    const blob = pdf.output('blob');
    const fileName = `${rtl ? 'استجابات_الاستبيان' : 'survey_responses'}_${surveyId.value}_${Date.now()}.pdf`;
    downloadFile(blob, fileName);
  } catch (error) {
    console.error('PDF generation error:', error);
    throw error;
  }
};

// Download as Word
const downloadAsWord = async (responses: any[]) => {
  const wordContent = generateWordContent(responses);

  // Create HTML with Word-compatible styling
  const htmlContent = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' 
              xmlns:w='urn:schemas-microsoft-com:office:word' 
              xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset='utf-8'>
          <title>تقرير استجابات الاستبيان</title>
          <style>
            body {
              font-family: 'Arial', sans-serif;
              direction: rtl;
              text-align: right;
              line-height: 1.6;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #2563eb;
              padding-bottom: 15px;
              margin-bottom: 30px;
            }
            .header h1 {
              color: #1e40af;
              font-size: 24pt;
            }
            .response-section {
              margin-bottom: 30px;
              padding: 15px;
              border: 1px solid #e2e8f0;
              background: #f8fafc;
            }
            .response-title {
              background: #3b82f6;
              color: white;
              padding: 10px;
              font-size: 14pt;
              font-weight: bold;
              margin-bottom: 15px;
            }
            .info-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 15px;
            }
            .info-table td {
              padding: 8px;
              border: 1px solid #cbd5e1;
            }
            .info-table td:first-child {
              background: #f1f5f9;
              font-weight: bold;
              width: 30%;
            }
            .question-block {
              margin: 15px 0;
              padding: 12px;
              background: white;
              border-right: 3px solid #60a5fa;
            }
            .question-text {
              color: #1e40af;
              font-weight: bold;
              margin-bottom: 8px;
            }
            .answer-text {
              background: #f1f5f9;
              padding: 10px;
              border-radius: 4px;
            }
          </style>
        </head>
        <body>
          ${wordContent}
        </body>
        </html>
      `;

  const blob = new Blob(["\ufeff", htmlContent], {
    type: "application/msword;charset=utf-8",
  });
  downloadFile(blob, `استجابات_الاستبيان_${surveyId.value}.doc`);
};

// Helper function to download file
const downloadFile = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// Generate Word content (formatted document)
const generateWordContent = (responses: any[]) => {
  const timestamp = new Date().toLocaleDateString("ar-SA", {
    calendar: "gregory",
  });

  let content = `
        <div class="header">
          <h1>تقرير استجابات الاستبيان</h1>
          <p>عدد الاستجابات: ${responses.length} | تاريخ التصدير: ${timestamp}</p>
        </div>
      `;

  responses.forEach((response, index) => {
    const isComplete = response.is_complete ? "مكتملة" : "غير مكتملة";
    const respondentName = response.respondent?.email || "مستجيب مجهول";
    const respondentType =
      response.respondent?.type === "authenticated"
        ? "مستخدم مسجل"
        : "مستخدم مجهول";

    content += `
          <div class="response-section">
            <div class="response-title">الاستجابة رقم ${index + 1} - ${formatDateForCSV(response.submitted_at)}</div>
            
            <table class="info-table">
              <tr>
                <td>المستجيب</td>
                <td>${respondentName}</td>
              </tr>
              <tr>
                <td>نوع المستجيب</td>
                <td>${respondentType}</td>
              </tr>
              <tr>
                <td>الحالة</td>
                <td>${isComplete}</td>
              </tr>
              <tr>
                <td>نسبة الإكمال</td>
                <td>${getCompletionPercentage(response)}%</td>
              </tr>
            </table>
            
            <h4>الإجابات:</h4>
        `;

    response.answers?.forEach((answer: any) => {
      const questionType = getQuestionTypeLabel(answer.question_type);
      content += `
            <div class="question-block">
              <div class="question-text">
                السؤال ${answer.question_order}: ${answer.question_text}
              </div>
              <div style="font-size: 11pt; color: #64748b; margin-bottom: 8px;">
                نوع السؤال: ${questionType}
              </div>
              <div class="answer-text">
                ${formatAnswerForCSV(answer)}
              </div>
            </div>
          `;
    });

    content += `</div>`;
  });

  return content;
};

// Generate CSV content with proper Arabic support
const generateArabicCSV = (responses: any[]) => {
  if (responses.length === 0) return "";

  // Get all unique questions from all responses
  const allQuestions = new Map();
  responses.forEach((response) => {
    response.answers?.forEach((answer: any) => {
      if (!allQuestions.has(answer.question_id)) {
        allQuestions.set(answer.question_id, {
          order: answer.question_order || 0,
          text:
            answer.question_text ||
            `سؤال ${answer.question_order || answer.question_id}`,
          type: answer.question_type || "text",
        });
      }
    });
  });

  // Sort questions by order
  const sortedQuestions = Array.from(allQuestions.entries()).sort(
    (a, b) => a[1].order - b[1].order,
  );

  // Create header row with questions and answers
  const headers = [
    "رقم الاستجابة",
    "المستجيب",
    "نوع المستجيب",
    "تاريخ الإرسال",
    "نسبة الإكمال",
  ];

  // Add question-answer pairs to headers
  sortedQuestions.forEach(([_, q]) => {
    headers.push(`السؤال ${q.order}: ${q.text}`);
    headers.push(`الإجابة ${q.order}`);
  });

  // Create data rows
  const rows = responses.map((response, index) => {
    const answerMap = new Map();
    response.answers?.forEach((answer: any) => {
      answerMap.set(answer.question_id, {
        question: answer.question_text || `سؤال ${answer.question_order}`,
        answer: formatAnswerForCSV(answer),
        type: answer.question_type,
        order: answer.question_order,
      });
    });

    const row = [
      index + 1,
      response.respondent?.email || "مجهول",
      response.respondent?.type === "authenticated" ? "مسجل" : "مجهول",
      formatDateForCSV(response.submitted_at),
      `${getCompletionPercentage(response)}%`,
    ];

    // Add question-answer pairs to row
    sortedQuestions.forEach(([questionId]) => {
      const qa = answerMap.get(questionId);
      if (qa) {
        row.push(qa.question);
        row.push(qa.answer);
      } else {
        row.push("لا يوجد سؤال");
        row.push("لا يوجد إجابة");
      }
    });

    return row;
  });

  // Combine headers and rows
  const allRows = [headers, ...rows];

  // Convert to CSV format with proper escaping
  return allRows
    .map((row) =>
      row
        .map((cell) => {
          const cellStr = String(cell || "");
          // Escape quotes and wrap in quotes if contains comma, quote, or newline
          if (
            cellStr.includes('"') ||
            cellStr.includes(",") ||
            cellStr.includes("\n")
          ) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          return cellStr;
        })
        .join(","),
    )
    .join("\n");
};

// Format answer for CSV export
const formatAnswerForCSV = (answer: any) => {
  if (!answer.answer_text) return "لا يوجد إجابة";

  let formattedAnswer = answer.answer_text.toString();

  // Handle different question types
  switch (answer.question_type) {
    case "rating":
      // Determine max rating from question_options or default to 5
      let maxRating = 5; // Default value

      if (
        answer.question_options &&
        Array.isArray(answer.question_options) &&
        answer.question_options.length > 0
      ) {
        // If we have options, get the maximum value
        const numericOptions = answer.question_options
          .map((opt: any) => Number(opt))
          .filter((num: number) => !isNaN(num));

        if (numericOptions.length > 0) {
          maxRating = Math.max(...numericOptions);
        }
      } else if (answer.answer_text) {
        // If no options, try to infer from the answer value
        const answerValue = Number(answer.answer_text);
        if (!isNaN(answerValue) && answerValue > 0) {
          // Assume standard scales: if answer is 1-5, max is 5; if 1-10, max is 10
          maxRating = answerValue <= 5 ? 5 : 10;
        }
      }

      formattedAnswer = `${answer.answer_text}/${maxRating}`;
      break;

    case "yes_no":
      formattedAnswer =
        answer.answer_text === "yes" ||
        answer.answer_text === "نعم" ||
        answer.answer_text === "1"
          ? "نعم"
          : "لا";
      break;

    case "multiple_choice":
      // Handle multiple selections
      if (Array.isArray(answer.answer_text)) {
        formattedAnswer = answer.answer_text.join("؛ ");
      }
      break;

    case "single_choice":
    case "text":
    case "textarea":
    default:
      // Keep original text, but clean up newlines for CSV
      formattedAnswer = formattedAnswer.replace(/\n/g, " ").replace(/\r/g, " ");
      break;
  }

  return formattedAnswer;
};

// Format date for CSV export
const formatDateForCSV = (dateString: string) => {
  if (!dateString) return "";

  const date = new Date(dateString);

  // Format in Arabic locale with Gregorian calendar
  return date.toLocaleString("ar-SA", {
    calendar: "gregory",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "Asia/Riyadh", // Adjust timezone as needed
  });
};

// Keep this function since it uses completedResponses
// @ts-ignore - This is used in the template
const getResponseRate = () => {
  const total = responses.value.length;
  if (total === 0) return 0;
  const completed = completedResponses.value;
  return Math.round((completed / total) * 100);
};

const getCompletionPercentage = (response: any) => {
  if (!survey.value || !survey.value.total_questions) return 0;
  const answered = response.answer_count || response.answers?.length || 0;
  return Math.round((answered / survey.value.total_questions) * 100);
};

function formatDate(dateString: string) {
  if (!dateString) return { date: "", time: "" };

  const date = new Date(dateString);
  
  // Format as YYYY-MM-DD
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  // Format as HH:MM
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return {
    date: `${year}-${month}-${day}`,
    time: `${hours}:${minutes}`
  };
}

const formatAnswer = (answer: any) => {
  if (!answer.answer_text) return t.value("survey.responses.noAnswer");

  if (answer.question_type === "rating") {
    // Determine max rating from question_options or default to 5
    let maxRating = 5; // Default value

    if (
      answer.question_options &&
      Array.isArray(answer.question_options) &&
      answer.question_options.length > 0
    ) {
      // If we have options, get the maximum value
      const numericOptions = answer.question_options
        .map((opt: any) => Number(opt))
        .filter((num: number) => !isNaN(num));

      if (numericOptions.length > 0) {
        maxRating = Math.max(...numericOptions);
      }
    } else if (answer.answer_text) {
      // If no options, try to infer from the answer value
      const answerValue = Number(answer.answer_text);
      if (!isNaN(answerValue) && answerValue > 0) {
        // Assume standard scales: if answer is 1-5, max is 5; if 1-10, max is 10
        maxRating = answerValue <= 5 ? 5 : 10;
      }
    }

    return `${answer.answer_text}/${maxRating}`;
  }

  if (answer.question_type === "yes_no") {
    return answer.answer_text === "yes"
      ? t.value("common.yes")
      : t.value("common.no");
  }

  if (
    answer.question_type === "single_choice" ||
    answer.question_type === "multiple_choice"
  ) {
    return answer.answer_text;
  }

  return answer.answer_text;
};

const latestResponseMeta = computed(() => {
  if (!responses.value.length) {
    return { date: "—", time: "", dayOfWeek: "", period: "" };
  }
  const latest = responses.value[0];
  const date = new Date(latest.submitted_at);
  const rtl = store.currentLanguage === "ar";
  const locale = rtl ? "ar-SA" : "en-US";
  
  // Get day of week
  const dayOfWeek = date.toLocaleDateString(locale, {
    weekday: 'long',
    calendar: 'gregory'
  });
  
  // Get time in English numerals
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const timeIn12Hour = hours % 12 || 12;
  const formattedTime = `${timeIn12Hour}:${minutes.toString().padStart(2, '0')}`;
  
  // Get period (AM/PM) in Arabic
  const period = hours >= 12 ? 'مساءً' : 'صباحا';
  
  const formatted = formatDate(latest.submitted_at);
  return {
    date: formatted.date,
    time: formattedTime,
    dayOfWeek: dayOfWeek,
    period: period,
  };
});

// Completion rate metric (currently unused but may be needed for future metrics display)
// const completionRateMetric = computed(() => {
//   const total = responses.value.length;
//   if (!total) return 0;
//   const completed = responses.value.filter(
//     (response) => response.is_complete,
//   ).length;
//   return Math.round((completed / total) * 100);
// });

const overviewCards = computed(() => {
  const totalResponsesCount =
    survey.value?.total_responses ?? responses.value.length ?? 0;
  const { date: latestDate, time: latestTime, dayOfWeek, period } = latestResponseMeta.value;

  return [
    {
      key: "total",
      label: "إجمالي الردود" ,
      value: totalResponsesCount,
      suffix: "رد" ,
      icon: `<svg width="30" height="30" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M10.4154 28.125C5.8112 28.125 2.08203 31.8542 2.08203 36.4583C2.08203 38.0208 2.51953 39.5 3.29036 40.75C4.72786 43.1667 7.3737 44.7917 10.4154 44.7917C13.457 44.7917 16.1029 43.1667 17.5404 40.75C18.3112 39.5 18.7487 38.0208 18.7487 36.4583C18.7487 31.8542 15.0195 28.125 10.4154 28.125ZM14.5195 35.7708L10.082 39.875C9.79036 40.1458 9.39453 40.2917 9.01953 40.2917C8.6237 40.2917 8.22786 40.1458 7.91536 39.8333L5.85286 37.7708C5.2487 37.1667 5.2487 36.1667 5.85286 35.5625C6.45703 34.9583 7.45703 34.9583 8.0612 35.5625L9.0612 36.5625L12.3945 33.4792C13.0195 32.8958 14.0195 32.9375 14.6029 33.5625C15.1862 34.1875 15.1445 35.1875 14.5195 35.7708Z" fill="#A17D23"/>
<path d="M35.9375 5.06152H16.1458C10.2083 5.06152 6.25 9.01986 6.25 14.9574V24.249C6.25 24.9782 7 25.499 7.70833 25.3115C8.58333 25.1032 9.47917 24.999 10.4167 24.999C16.375 24.999 21.2917 29.8324 21.8333 35.6865C21.875 36.2699 22.3542 36.7282 22.9167 36.7282H24.0625L32.875 42.6032C34.1667 43.4782 35.9375 42.5199 35.9375 40.9365V36.7282C38.8958 36.7282 41.375 35.7282 43.1042 34.0199C44.8333 32.2699 45.8333 29.7907 45.8333 26.8324V14.9574C45.8333 9.01986 41.875 5.06152 35.9375 5.06152ZM32.9792 22.5199H19.1042C18.2917 22.5199 17.625 21.8532 17.625 21.0407C17.625 20.2074 18.2917 19.5407 19.1042 19.5407H32.9792C33.7917 19.5407 34.4583 20.2074 34.4583 21.0407C34.4583 21.8532 33.7917 22.5199 32.9792 22.5199Z" fill="#A17D23"/>
</svg>`
    },
    {
      key: "completionRate",
      label: "ذروة النشاط" ,
      value: latestTime,
      period: period,
      icon: `<svg width="30" height="30" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M26.7341 45.4205C33.2465 44.1151 41.6667 39.4303 41.6667 27.316C41.6667 16.2919 33.5972 8.95091 27.7949 5.57782C26.5073 4.82934 25 5.81368 25 7.30297V11.1123C25 14.1162 23.737 19.5992 20.2277 21.8798C18.4361 23.0442 16.5011 21.3015 16.2833 19.1758L16.1045 17.4303C15.8967 15.4011 13.83 14.1693 12.2082 15.4065C9.29472 17.629 6.25 21.5211 6.25 27.316C6.25 42.1308 17.2685 45.8345 22.7778 45.8345C23.0982 45.8345 23.435 45.8249 23.7856 45.8048C21.0652 45.5722 16.6667 43.8845 16.6667 38.4265C16.6667 34.1571 19.7814 31.2687 22.148 29.8648C22.7845 29.4872 23.5294 29.9775 23.5294 30.7175V31.9451C23.5294 32.8845 23.8927 34.3529 24.7576 35.3581C25.7362 36.4956 27.1727 35.304 27.2886 33.808C27.3251 33.336 27.7998 33.0352 28.2085 33.2741C29.5446 34.0549 31.25 35.723 31.25 38.4265C31.25 42.6932 28.898 44.6559 26.7341 45.4205Z" fill="#A17D23"/>
</svg>`
    },
    {
      key: "latest",
      label: "انشط يوم" ,
      value: dayOfWeek,
      hint: latestDate,
      icon: `<svg width="30" height="30" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M16.1432 5.20801C16.1432 4.34506 15.4437 3.64551 14.5807 3.64551C13.7178 3.64551 13.0182 4.34506 13.0182 5.20801V8.49813C10.0196 8.73824 8.05109 9.32754 6.60484 10.7738C5.15859 12.22 4.5693 14.1886 4.32918 17.1872H45.6656C45.4255 14.1886 44.8362 12.22 43.3899 10.7738C41.9437 9.32754 39.9752 8.73824 36.9766 8.49813V5.20801C36.9766 4.34506 36.277 3.64551 35.4141 3.64551C34.5511 3.64551 33.8516 4.34506 33.8516 5.20801V8.35989C32.4656 8.33301 30.9121 8.33301 29.1641 8.33301H20.8307C19.0827 8.33301 17.5292 8.33301 16.1432 8.35989V5.20801Z" fill="#A17D23"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M45.8307 24.9997C45.8307 23.2517 45.8307 21.6981 45.8038 20.3122H4.19094C4.16406 21.6981 4.16406 23.2517 4.16406 24.9997V29.1663C4.16406 37.0231 4.16406 40.9515 6.60484 43.3922C9.04562 45.833 12.974 45.833 20.8307 45.833H29.1641C37.0208 45.833 40.9492 45.833 43.3899 43.3922C45.8307 40.9515 45.8307 37.0231 45.8307 29.1663V24.9997ZM29.1641 25.5205C27.1505 25.5205 25.5182 27.1528 25.5182 29.1663V33.333C25.5182 35.3465 27.1505 36.9788 29.1641 36.9788C31.1776 36.9788 32.8099 35.3465 32.8099 33.333V29.1663C32.8099 27.1528 31.1776 25.5205 29.1641 25.5205ZM29.1641 28.6455C28.8764 28.6455 28.6432 28.8787 28.6432 29.1663V33.333C28.6432 33.6207 28.8764 33.8538 29.1641 33.8538C29.4517 33.8538 29.6849 33.6207 29.6849 33.333V29.1663C29.6849 28.8787 29.4517 28.6455 29.1641 28.6455ZM22.4703 25.6394C23.0542 25.8813 23.4349 26.451 23.4349 27.083V35.4163C23.4349 36.2793 22.7353 36.9788 21.8724 36.9788C21.0095 36.9788 20.3099 36.2793 20.3099 35.4163V30.8552L19.8523 31.3129C19.2421 31.9231 18.2527 31.9231 17.6425 31.3129C17.0323 30.7027 17.0323 29.7133 17.6425 29.1032L20.7675 25.9782C21.2144 25.5313 21.8865 25.3976 22.4703 25.6394Z" fill="#A17D23"/>
</svg>`
    },
  ];
});

const getQuestionTypeIcon = (type: string) => {
  const icons = {
    text: "fas fa-font",
    textarea: "fas fa-align-right",
    single_choice: "fas fa-dot-circle",
    multiple_choice: "fas fa-check-square",
    rating: "fas fa-star",
    yes_no: "fas fa-toggle-on",
  };
  return icons[type as keyof typeof icons] || "fas fa-question";
};

const getQuestionTypeLabel = (type: string) => {
  const labels = {
    text: t.value("survey.questionTypes.text"),
    textarea: t.value("survey.questionTypes.textarea"),
    single_choice: t.value("survey.questionTypes.single_choice"),
    multiple_choice: t.value("survey.questionTypes.multiple_choice"),
    rating: t.value("survey.questionTypes.rating"),
    yes_no: t.value("survey.questionTypes.yes_no"),
  };
  return labels[type as keyof typeof labels] || type;
};

const goBack = () => {
  router.go(-1);
};

// Analytics methods
const switchToAnalytics = async () => {
  if (activeTab.value === "analytics") return; // Prevent unnecessary calls

  activeTab.value = "analytics";

  // Wait for the DOM to update before checking if we need to load analytics
  await nextTick();

  // Only load analytics if we don't have data AND we're not already loading
  if (!surveyAnalytics.value && !analyticsLoadingPromise.value) {
    await loadAnalytics();
  }
};

// const switchToQuestionAnalytics = async () => {
//   if (activeTab.value === 'questions') return // Prevent unnecessary calls

//   activeTab.value = 'questions'

//   // Wait for the DOM to update before checking if we need to load analytics
//   await nextTick()

//   // Only load analytics if we don't have data AND we're not already loading
//   if ((!questionAnalytics.value || questionAnalytics.value.length === 0) && !analyticsLoadingPromise.value) {
//     await loadAnalytics()
//   }
// }

const loadAnalytics = async () => {
  // If already loading, return the existing promise to prevent concurrent calls
  if (analyticsLoadingPromise.value) {
    return analyticsLoadingPromise.value;
  }

  const loadPromise = (async () => {
    try {
      // Mark as programmatic before any state changes to ignore child emissions
      isProgrammaticAnalyticsUpdate.value = true;
      analyticsLoading.value = true;
      analyticsError.value = null;

      // Load survey-level analytics using the correct endpoint from JSON
      const surveyAnalyticsResponse = await apiClient.get(
        `/surveys/admin/surveys/${surveyId.value}/dashboard/`,
      );

      if (surveyAnalyticsResponse.status === 200) {
        // Store the response data
        const responseData = surveyAnalyticsResponse?.data;

        // Add survey ID to the response data for child components
        if (responseData?.data) {
          responseData.data.survey = {
            id: surveyId.value,
            ...responseData.data.survey,
          };
          console.log("✅ Added survey ID to analytics data:", surveyId.value);
        }

        surveyAnalytics.value = responseData;

        // Extract question analytics from the survey response if available
        if (responseData?.data?.questions_summary) {
          const extractedQuestions = responseData?.data?.questions_summary.map(
            (question: any) => ({
              ...question,
              question_id: question.question_id,
              question_order: question.order,
              question_type: question.type,
              question_text:
                question.question_text || `Question ${question.order}`,
              analytics: question.distributions || {},
            }),
          );
          questionAnalytics.value = extractedQuestions;
        }
        // Default filters snapshot to avoid re-fetch from initial/default emissions
        if (!lastAnalyticsFiltersKey.value) {
          lastAnalyticsFiltersKey.value = JSON.stringify({
            start: "",
            end: "",
            group_by: "day",
          });
        }
      }
    } catch (error) {
      console.error("Analytics loading error:", error);
      analyticsError.value =
        error instanceof Error ? error.message : "Failed to load analytics";
    } finally {
      analyticsLoading.value = false;
      analyticsLoadingPromise.value = null; // Clear the promise
      // Next tick to let children settle, then clear the programmatic flag
      await nextTick();
      isProgrammaticAnalyticsUpdate.value = false;
    }
  })();

  analyticsLoadingPromise.value = loadPromise;
  return loadPromise;
};

const getQuestionAnalyticsComponent = (questionType: string) => {
  const componentMap: Record<string, any> = {
    single_choice: SingleChoiceAnalytics,
    multiple_choice: MultipleChoiceAnalytics,
    rating: RatingAnalytics,
    yes_no: YesNoAnalytics,
    text: TextAnalytics,
    textarea: TextAnalytics,
  };
  return componentMap[questionType] || TextAnalytics;
};

// Validate question analytics data before rendering
const isValidQuestionAnalytics = (question: any): boolean => {
  if (!question) return false;

  const questionType = question.question_type || question.type;

  // For text/textarea questions, check if analytics data structure exists
  if (questionType === "text" || questionType === "textarea") {
    const transformed = transformQuestionAnalytics(question);

    // Check if the transformed data has the expected structure
    return !!(
      transformed.analytics?.analytics?.textual ||
      transformed.analytics?.textual ||
      transformed.textual ||
      (transformed.kpis && typeof transformed.kpis.answer_count === "number")
    );
  }

  // For other question types, basic validation
  return !!(question.analytics || question.distributions || question.kpis);
};

// Transform question analytics data to match component expectations
const transformQuestionAnalytics = (question: any) => {
  const transformed = { ...question };

  // If analytics is empty but distributions exist, move distributions to analytics.analytics
  if (
    (!transformed.analytics ||
      Object.keys(transformed.analytics).length === 0) &&
    transformed.distributions
  ) {
    transformed.analytics = {
      analytics: transformed.distributions,
    };
  }

  // Ensure textual analytics has the expected structure
  if (transformed.analytics?.textual) {
    transformed.analytics.analytics = {
      textual: {
        total_responses:
          transformed.analytics.textual.total_responses ||
          transformed.kpis?.answer_count ||
          0,
        avg_words: transformed.analytics.textual.avg_words || 0,
        avg_word_count: transformed.analytics.textual.avg_words || 0,
        avg_char_count: transformed.analytics.textual.avg_chars || 0,
        response_lengths: transformed.analytics.textual.response_lengths || {},
      },
    };
  } else if (transformed.distributions?.textual) {
    transformed.analytics = {
      analytics: {
        textual: {
          total_responses:
            transformed.distributions.textual.total_responses ||
            transformed.kpis?.answer_count ||
            0,
          avg_words: transformed.distributions.textual.avg_words || 0,
          avg_word_count: transformed.distributions.textual.avg_words || 0,
          avg_char_count: transformed.distributions.textual.avg_chars || 0,
          response_lengths:
            transformed.distributions.textual.response_lengths || {},
        },
      },
    };
  } else if (
    (transformed.type === "text" || transformed.type === "textarea") &&
    (!transformed.analytics || Object.keys(transformed.analytics).length === 0)
  ) {
    // For empty text analytics, provide default structure
    transformed.analytics = {
      analytics: {
        textual: {
          total_responses: transformed.kpis?.answer_count || 0,
          avg_words: 0,
          avg_word_count: 0,
          avg_char_count: 0,
          response_lengths: {},
        },
      },
    };
  }

  return transformed;
};

// Analytics event handlers
const onAnalyticsQuestionClick = (_question: any) => {
  // Switch to question analytics tab and highlight specific question
  activeTab.value = "questions";

  // If we have question analytics loaded, scroll to specific question
  // You could implement scrolling to specific question here
};

const onAnalyticsPeriodClick = (_period: any) => {
  // Handle period click (could filter responses by this period)
  // Example: filter responses by this period
  // startDate.value = period.start
  // endDate.value = period.end
  // loadSurveyResponses()
};

const onAnalyticsFiltersChange = async () => {
  if (isProgrammaticAnalyticsUpdate.value) return;
  if (
    analyticsLoading.value ||
    analyticsLoadingPromise.value ||
    isHandlingAnalyticsFilters.value
  )
    return;
  if (!surveyAnalytics.value) return;

  // نفّذ مباشرة
  try {
    isHandlingAnalyticsFilters.value = true;
    isProgrammaticAnalyticsUpdate.value = true;
    analyticsLoading.value = true;
    // build params + call API + set surveyAnalytics.value
  } finally {
    analyticsLoading.value = false;
    await nextTick();
    isProgrammaticAnalyticsUpdate.value = false;
    isHandlingAnalyticsFilters.value = false;
  }
};

// Lifecycle
onMounted(() => {
  if (surveyId.value) {
    loadSurveyResponses();
    
    // Load analytics if the stored tab is analytics
    if (activeTab.value === "analytics") {
      loadAnalytics();
    }
  }
});

// نفس منطق التحويل عندك لكن هنستدعيه مرة فقط
const normalizeQuestion = (q: any) => {
  const t = { ...q };
  if (
    (!t.analytics || Object.keys(t.analytics).length === 0) &&
    t.distributions
  ) {
    t.analytics = { analytics: t.distributions };
  }
  if (t.analytics?.textual) {
    t.analytics.analytics = {
      textual: {
        total_responses:
          t.analytics.textual.total_responses || t.kpis?.answer_count || 0,
        avg_words: t.analytics.textual.avg_words || 0,
        avg_word_count: t.analytics.textual.avg_words || 0,
        avg_char_count: t.analytics.textual.avg_chars || 0,
        response_lengths: t.analytics.textual.response_lengths || {},
      },
    };
  } else if (t.distributions?.textual) {
    t.analytics = {
      analytics: {
        textual: {
          total_responses:
            t.distributions.textual.total_responses ||
            t.kpis?.answer_count ||
            0,
          avg_words: t.distributions.textual.avg_words || 0,
          avg_word_count: t.distributions.textual.avg_words || 0,
          avg_char_count: t.distributions.textual.avg_chars || 0,
          response_lengths: t.distributions.textual.response_lengths || {},
        },
      },
    };
  } else if (
    (t.type === "text" || t.type === "textarea") &&
    (!t.analytics || Object.keys(t.analytics).length === 0)
  ) {
    t.analytics = {
      analytics: {
        textual: {
          total_responses: t.kpis?.answer_count || 0,
          avg_words: 0,
          avg_word_count: 0,
          avg_char_count: 0,
          response_lengths: {},
        },
      },
    };
  }
  return t;
};

// حافظ على مرجع ثابت لكل عنصر (لو نفس العنصر ما اتغيرش بالمرجع)
const _cache = new WeakMap<any, any>();
const normalizedQuestionAnalytics = computed(() => {
  return (questionAnalytics.value || []).map((q) => {
    if (_cache.has(q)) return _cache.get(q);
    const nq = normalizeQuestion(q);
    _cache.set(q, nq);
    return nq;
  });
});
</script>

<style module src="./SurveyResponses.module.css">
/* CSS Module styles are imported from SurveyResponses.module.css */
</style>
