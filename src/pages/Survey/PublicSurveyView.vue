<template>
  <div :class="$style.publicSurveyContainer" :data-theme="currentTheme" dir="rtl">
    <!-- Loading State -->
    <div v-if="isLoading" :class="$style.loadingContainer">
      <div :class="$style.loadingSpinner"></div>
      <p :class="$style.loadingText">جاري تحميل الاستطلاع...</p>
    </div>

    <!-- Access Denied -->
    <div v-else-if="accessDenied" :class="$style.accessDenied">
      <div :class="$style.deniedIcon">
        <i class="fas fa-lock"></i>
      </div>
      <h2 :class="$style.deniedTitle">عذراً، الوصول مرفوض</h2>
      <p :class="$style.deniedMessage">{{ accessMessage }}</p>
      
      <!-- Show additional details if available -->
      <div v-if="surveyData && surveyData.start_date && surveyData.end_date" :class="$style.scheduleInfo">
        <div :class="$style.scheduleItem">
          <i class="fas fa-calendar-plus"></i>
          <span>تاريخ البداية: {{ formatDate(surveyData.start_date) }}</span>
        </div>
        <div :class="$style.scheduleItem">
          <i class="fas fa-calendar-times"></i>
          <span>تاريخ النهاية: {{ formatDate(surveyData.end_date) }}</span>
        </div>
      </div>
    </div>

    <!-- Survey Content -->
    <div v-else-if="survey && !surveyStarted" :class="$style.surveyContent">
      <!-- Survey Header -->
      <div :class="$style.surveyHeader">
        <div :class="$style.surveyBranding">

          <h1 :class="$style.surveyTitle">{{ survey.title }}</h1>
          <p v-if="survey.description" :class="$style.surveyDescription">{{ survey.description }}</p>
        </div>
        
        <div :class="$style.surveyMeta">
          <div :class="$style.metaItem">
            <i class="fas fa-question-circle"></i>
            <span>{{ survey.questions?.length || 0 }} سؤال</span>
          </div>
          <div :class="$style.metaItem">
            <i class="fas fa-users"></i>
            <span>استطلاع عام</span>
          </div>
        </div>
      </div>

      <!-- Welcome Message -->
      <!-- Direct Arabic text - no i18n -->
      <div :class="$style.welcomeSection">
        <div :class="$style.welcomeContent">
          <div :class="$style.welcomeIcon">
            <i class="fas fa-heart"></i>
          </div>
          <h3 :class="$style.welcomeTitle">أهلاً وسهلاً بك في استطلاعنا</h3>
          <p :class="$style.welcomeText">
            نقدر وقتك وآرائك القيمة. إجاباتك ستساعدنا في تحسين خدماتنا وتطوير تجربة أفضل للجميع.
            الاستطلاع سهل وسريع، وجميع إجاباتك محفوظة بسرية تامة.
          </p>
        </div>
      </div>

      <!-- Action Buttons -->
      <div :class="$style.actionButtons">
        <button :class="$style.startButton" @click="startSurvey">
          <i class="fas fa-play"></i>
          <span>ابدأ الاستطلاع الآن</span>
        </button>
        
        <div :class="$style.secondaryActions">
          <button :class="$style.secondaryButton" @click="copyLink">
            <i class="fas fa-share"></i>
            <span>شارك الرابط</span>
          </button>
        </div>
        
      </div>
    </div>

    <!-- Survey Form (When Started) -->
    <div v-else-if="survey && surveyStarted" :class="$style.surveyForm">
      <!-- Survey Form Header -->
      <div :class="$style.formHeader">
        <div :class="$style.formTitleSection">
          <h1 :class="$style.formTitle">{{ survey.title }}</h1>
          <div :class="$style.formSubtitle">
            <i class="fas fa-user-edit"></i>
            <span>يرجى الإجابة على الأسئلة التالية بعناية</span>
          </div>
        </div>
        
        <!-- View Mode Toggle -->
        <div :class="$style.viewModeToggle">
          <button 
            :class="[$style.toggleButton, { [$style.active]: showAllQuestions }]"
            @click="showAllQuestions = true"
            title="عرض جميع الأسئلة في صفحة واحدة"
          >
            <i class="fas fa-list"></i>
            <span>جميع الأسئلة</span>
          </button>
          <button 
            :class="[$style.toggleButton, { [$style.active]: !showAllQuestions }]"
            @click="showAllQuestions = false"
            title="عرض سؤال واحد في كل مرة"
          >
            <i class="fas fa-file-alt"></i>
            <span>سؤال بسؤال</span>
          </button>
        </div>
        
        <div v-if="!showAllQuestions" :class="$style.progressSection">
          <div :class="$style.progressBar">
            <div :class="$style.progressFill" :style="{ width: progressPercentage + '%' }"></div>
          </div>
          <div :class="$style.progressInfo">
            <span :class="$style.progressText">
              السؤال {{ currentQuestionIndex + 1 }} من {{ survey.questions?.length || 0 }}
            </span>
          </div>
        </div>
      </div>

      <!-- All Questions View (Google Forms Style) -->
      <div v-if="showAllQuestions" :class="$style.allQuestionsContainer">
        <div 
          v-for="(question, index) in survey.questions" 
          :key="question.id"
          :class="$style.questionContainer"
        >
          <div :class="$style.currentQuestion">
            <div :class="$style.questionHeader">
              <div :class="$style.questionBadge">
                <span :class="$style.questionIndex">{{ index + 1 }}</span>
              </div>
              <h2 :class="$style.questionTitle">
                {{ question.text }}
                <span v-if="question.is_required" :class="$style.required">*</span>
              </h2>
            </div>

            <!-- Text Input -->
            <div v-if="question.question_type === 'text'" :class="$style.inputContainer">
              <div :class="$style.inputWrapper">
                <input
                  :type="getInputConfig(question.validation_type || 'none').type"
                  :pattern="getInputConfig(question.validation_type || 'none').pattern"
                  :class="[$style.textInput, { [$style.inputError]: getValidationError(question.id) }]"
                  v-model="answers[question.id]"
                  :maxlength="getMaxLength('text')"
                  @blur="handleInputBlur(question)"
                  @input="(e) => { clearValidationError(question.id); handleTextInput(question.id, 'text', e); }"
                  :placeholder="getInputConfig(question.validation_type || 'none').placeholder || 'اكتب إجابتك هنا...'"
                />
              </div>
              <div :class="$style.characterCount" :data-warning="getRemainingCharacters(question.id, 'text') < 100">
                <span>{{ getCharacterCount(question.id) }} / {{ getMaxLength('text') }}</span>
                <span v-if="getRemainingCharacters(question.id, 'text') < 100" :class="$style.remainingWarning">
                  ({{ getRemainingCharacters(question.id, 'text') }} حرف متبقي)
                </span>
              </div>
              <div v-if="getValidationError(question.id)" :class="$style.errorMessage">
                <i class="fas fa-exclamation-circle"></i>
                <span>{{ getValidationError(question.id) }}</span>
              </div>
            </div>

            <!-- Textarea Input -->
            <div v-else-if="question.question_type === 'textarea'" :class="$style.inputContainer">
              <div :class="$style.inputWrapper">
                <textarea
                  :class="$style.textArea"
                  v-model="answers[question.id]"
                  :maxlength="getMaxLength('textarea')"
                  @input="(e) => handleTextInput(question.id, 'textarea', e)"
                  placeholder="اكتب إجابتك المفصلة هنا... يمكنك كتابة عدة أسطر"
                  rows="4"
                ></textarea>
              </div>
              <div :class="$style.characterCount" :data-warning="getRemainingCharacters(question.id, 'textarea') < 200">
                <span>{{ getCharacterCount(question.id) }} / {{ getMaxLength('textarea') }}</span>
                <span v-if="getRemainingCharacters(question.id, 'textarea') < 200" :class="$style.remainingWarning">
                  ({{ getRemainingCharacters(question.id, 'textarea') }} حرف متبقي)
                </span>
              </div>
            </div>

            <!-- Single Choice -->
            <div v-else-if="question.question_type === 'single_choice'" :class="$style.choicesContainer">
              <div
                v-for="(option, optIndex) in getQuestionOptions(question.options)"
                :key="optIndex"
                :class="[$style.choiceOption, { [$style.selected]: answers[question.id] === option }]"
                @click="answers[question.id] = option"
              >
                <div :class="$style.choiceRadio">
                  <div v-if="answers[question.id] === option" :class="$style.radioSelected"></div>
                </div>
                <span :class="$style.choiceText">{{ option }}</span>
                <div :class="$style.choiceCheck" v-if="answers[question.id] === option">
                  <i class="fas fa-check"></i>
                </div>
              </div>
            </div>

            <!-- Multiple Choice -->
            <div v-else-if="question.question_type === 'multiple_choice'" :class="$style.choicesContainer">
              <div
                v-for="(option, optIndex) in getQuestionOptions(question.options)"
                :key="optIndex"
                :class="[$style.choiceOption, { [$style.selected]: isOptionSelected(question.id, option) }]"
                @click="toggleMultipleChoice(question.id, option)"
              >
                <div :class="$style.choiceCheckbox">
                  <i v-if="isOptionSelected(question.id, option)" class="fas fa-check"></i>
                </div>
                <span :class="$style.choiceText">{{ option }}</span>
                <div :class="$style.choiceCheck" v-if="isOptionSelected(question.id, option)">
                  <i class="fas fa-check-circle"></i>
                </div>
              </div>
            </div>

            <!-- Rating -->
            <div v-else-if="question.question_type === 'rating'" :class="$style.ratingContainer">
              <div :class="$style.ratingScale">
                <button
                  v-for="rating in getRatingOptions(question.options)"
                  :key="rating"
                  :class="[$style.ratingButton, { [$style.selected]: answers[question.id] === rating }]"
                  @click="answers[question.id] = rating"
                >
                  <span :class="$style.ratingNumber">{{ rating }}</span>
                </button>
              </div>
              <div :class="$style.ratingLabels">
                <span>{{ getRatingLabel('min', question.options) }}</span>
                <span>{{ getRatingLabel('max', question.options) }}</span>
              </div>
            </div>

            <!-- Yes/No -->
            <div v-else-if="question.question_type === 'yes_no'" :class="$style.yesNoWrapper">
              <div :class="$style.yesNoContainer">
                <div :class="$style.yesNoButtons">
                  <button
                    :class="[$style.yesNoButton, $style.yes, { [$style.selected]: answers[question.id] === 'yes' }]"
                    @click="answers[question.id] = 'yes'"
                    type="button"
                  >
                    <i class="fas fa-check" :class="$style.yesNoButtonIcon"></i>
                    <span :class="$style.yesNoButtonText">نعم</span>
                  </button>
                  <button
                    :class="[$style.yesNoButton, $style.no, { [$style.selected]: answers[question.id] === 'no' }]"
                    @click="answers[question.id] = 'no'"
                    type="button"
                  >
                    <i class="fas fa-times" :class="$style.yesNoButtonIcon"></i>
                    <span :class="$style.yesNoButtonText">لا</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Contact Section for All Questions View -->
        <div v-if="!survey?.per_device_access" :class="$style.contactSection">
          <div :class="$style.questionContainer">
            <div :class="$style.currentQuestion">
              <div :class="$style.contactHeader">
                <h3 :class="$style.contactTitle">
                  <i :class="getContactIcon()"></i>
                  {{ getContactTitle() }}
                </h3>
                <p :class="$style.contactDescription">
                  {{ getContactDescription() }}
                </p>
              </div>
              
              <!-- Email Input -->
              <div v-if="requiredContactMethod === 'email'" :class="$style.contactInputContainer">
                <div :class="$style.inputWrapper">
                  <input
                    type="email"
                    :class="[$style.textInput, { [$style.error]: contactError }]"
                    v-model="userEmail"
                    placeholder="example@domain.com"
                    @input="contactError = ''"
                  />
                </div>
                
                <div v-if="contactError" :class="$style.contactError">
                  <i class="fas fa-exclamation-triangle"></i>
                  <span>{{ contactError }}</span>
                </div>
              </div>

              <!-- Phone Input -->
              <div v-else-if="requiredContactMethod === 'phone'" :class="$style.contactInputContainer">
                <div :class="$style.phoneInputWrapper">
                  <!-- Country Code Selector -->
                  <div :class="$style.countrySelector" @click.stop>
                    <button 
                      :class="$style.countryButton"
                      @click="showCountryDropdown = !showCountryDropdown"
                      type="button"
                    >
                      <span :class="$style.countryFlag">{{ selectedCountry.flag }}</span>
                      <span :class="$style.countryCode">{{ selectedCountry.dialCode }}</span>
                      <i class="fas fa-chevron-down" :class="$style.dropdownArrow"></i>
                    </button>
                    
                    <!-- Country Dropdown -->
                    <div v-if="showCountryDropdown" :class="$style.countryDropdown">
                      <div :class="$style.searchWrapper">
                        <input
                          ref="countrySearchInput"
                          type="text"
                          :class="$style.searchInput"
                          :value="searchQuery"
                          @input="filterCountries"
                          placeholder="ابحث عن دولة..."
                        />
                        <i class="fas fa-search" :class="$style.searchIcon"></i>
                      </div>
                      <div :class="$style.countriesList">
                        <div
                          v-for="country in filteredCountries"
                          :key="country.code"
                          :class="$style.countryItem"
                          @click="selectCountry(country)"
                        >
                          <span :class="$style.countryFlag">{{ country.flag }}</span>
                          <span :class="$style.countryName">{{ country.nameAr }}</span>
                          <span :class="$style.countryDialCode">{{ country.dialCode }}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Phone Number Input -->
                  <div :class="$style.inputWrapper">
                    <input
                      type="tel"
                      :class="[$style.textInput, { [$style.error]: contactError }]"
                      v-model="userPhone"
                      placeholder="5XXXXXXXX"
                      @input="contactError = ''"
                    />
                  </div>
                </div>
                
                <div v-if="contactError" :class="$style.contactError">
                  <i class="fas fa-exclamation-triangle"></i>
                  <span>{{ contactError }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Submit Button for All Questions View -->
        <div :class="$style.submitContainer">
          <button
            :class="[$style.navButton, $style.submit]"
            @click="submitSurvey"
            :disabled="!canSubmit || isSubmitting || !hasValidContactForSubmission"
          >
            <i v-if="isSubmitting" class="fas fa-spinner fa-spin"></i>
            <i v-else class="fas fa-paper-plane"></i>
            <span>{{ isSubmitting ? 'جاري الإرسال...' : 'إرسال الاستطلاع' }}</span>
          </button>
        </div>
      </div>

      <!-- Single Question View (One at a Time) -->
      <div v-else>
        <!-- Current Question -->
        <div :class="$style.questionContainer">
        <div :class="$style.currentQuestion" v-if="currentQuestion">
          <div :class="$style.questionHeader">
            <div :class="$style.questionBadge">
              <span :class="$style.questionIndex">{{ currentQuestionIndex + 1 }}</span>
            </div>
            <h2 :class="$style.questionTitle">
              {{ currentQuestion.text }}
              <span v-if="currentQuestion.is_required" :class="$style.required">*</span>
            </h2>
            <div v-if="currentQuestion.is_required" :class="$style.requiredNote">
              <i class="fas fa-star"></i>
              <span>هذا السؤال مطلوب</span>
            </div>
          </div>

          <!-- Text Input -->
          <div v-if="currentQuestion.question_type === 'text'" :class="$style.inputContainer">
            <div :class="$style.inputWrapper">
              <input
                :type="getInputConfig(currentQuestion.validation_type || 'none').type"
                :pattern="getInputConfig(currentQuestion.validation_type || 'none').pattern"
                :class="[$style.textInput, { [$style.inputError]: getValidationError(currentQuestion.id) }]"
                v-model="answers[currentQuestion.id]"
                :maxlength="getMaxLength('text')"
                @blur="handleInputBlur(currentQuestion)"
                @input="(e) => { if (currentQuestion) { clearValidationError(currentQuestion.id); handleTextInput(currentQuestion.id, 'text', e); } }"
                :placeholder="getInputConfig(currentQuestion.validation_type || 'none').placeholder || 'اكتب إجابتك هنا...'"
              />
            </div>
            <div :class="$style.characterCount" :data-warning="getRemainingCharacters(currentQuestion.id, 'text') < 100">
              <span>{{ getCharacterCount(currentQuestion.id) }} / {{ getMaxLength('text') }}</span>
              <span v-if="getRemainingCharacters(currentQuestion.id, 'text') < 100" :class="$style.remainingWarning">
                ({{ getRemainingCharacters(currentQuestion.id, 'text') }} حرف متبقي)
              </span>
            </div>
            <div v-if="getValidationError(currentQuestion.id)" :class="$style.errorMessage">
              <i class="fas fa-exclamation-circle"></i>
              <span>{{ getValidationError(currentQuestion.id) }}</span>
            </div>
          </div>

          <!-- Textarea Input -->
          <div v-else-if="currentQuestion.question_type === 'textarea'" :class="$style.inputContainer">
            <div :class="$style.inputWrapper">
              <textarea
                :class="$style.textArea"
                v-model="answers[currentQuestion.id]"
                :maxlength="getMaxLength('textarea')"
                @input="(e) => { if (currentQuestion) handleTextInput(currentQuestion.id, 'textarea', e); }"
                placeholder="اكتب إجابتك المفصلة هنا... يمكنك كتابة عدة أسطر"
                rows="4"
              ></textarea>
            </div>
            <div :class="$style.characterCount" :data-warning="getRemainingCharacters(currentQuestion.id, 'textarea') < 200">
              <span>{{ getCharacterCount(currentQuestion.id) }} / {{ getMaxLength('textarea') }}</span>
              <span v-if="getRemainingCharacters(currentQuestion.id, 'textarea') < 200" :class="$style.remainingWarning">
                ({{ getRemainingCharacters(currentQuestion.id, 'textarea') }} حرف متبقي)
              </span>
            </div>
          </div>

          <!-- Single Choice -->
          <div v-else-if="currentQuestion.question_type === 'single_choice'" :class="$style.choicesContainer">
            <div :class="$style.choicesTitle">
              <i class="fas fa-dot-circle"></i>
              <span>اختر إجابة واحدة:</span>
            </div>
            <div
              v-for="(option, index) in getQuestionOptions(currentQuestion.options)"
              :key="index"
              :class="[$style.choiceOption, { [$style.selected]: answers[currentQuestion.id] === option }]"
              @click="answers[currentQuestion.id] = option"
            >
              <div :class="$style.choiceRadio">
                <div v-if="answers[currentQuestion.id] === option" :class="$style.radioSelected"></div>
              </div>
              <span :class="$style.choiceText">{{ option }}</span>
              <div :class="$style.choiceCheck" v-if="answers[currentQuestion.id] === option">
                <i class="fas fa-check"></i>
              </div>
            </div>
          </div>

          <!-- Multiple Choice -->
          <div v-else-if="currentQuestion.question_type === 'multiple_choice'" :class="$style.choicesContainer">
            <div :class="$style.choicesTitle">
              <i class="fas fa-check-square"></i>
              <span>يمكنك اختيار أكثر من إجابة:</span>
            </div>
            <div
              v-for="(option, index) in getQuestionOptions(currentQuestion.options)"
              :key="index"
              :class="[$style.choiceOption, { [$style.selected]: isOptionSelected(currentQuestion.id, option) }]"
              @click="toggleMultipleChoice(currentQuestion.id, option)"
            >
              <div :class="$style.choiceCheckbox">
                <i v-if="isOptionSelected(currentQuestion.id, option)" class="fas fa-check"></i>
              </div>
              <span :class="$style.choiceText">{{ option }}</span>
              <div :class="$style.choiceCheck" v-if="isOptionSelected(currentQuestion.id, option)">
                <i class="fas fa-check-circle"></i>
              </div>
            </div>
          </div>

          <!-- Rating -->
          <div v-else-if="currentQuestion.question_type === 'rating'" :class="$style.ratingContainer">
            <div :class="$style.ratingTitle">
              <i class="fas fa-star"></i>
              <span>قيم من {{ getRatingRange(currentQuestion.options) }}:</span>
            </div>
            <div :class="$style.ratingScale">
              <button
                v-for="rating in getRatingOptions(currentQuestion.options)"
                :key="rating"
                :class="[$style.ratingButton, { [$style.selected]: answers[currentQuestion.id] === rating }]"
                @click="answers[currentQuestion.id] = rating"
              >
                <span :class="$style.ratingNumber">{{ rating }}</span>
              </button>
            </div>
            <div :class="$style.ratingLabels">
              <span>{{ getRatingLabel('min') }}</span>
              <span>{{ getRatingLabel('max') }}</span>
            </div>
          </div>

          <!-- Yes/No -->
          <div v-else-if="currentQuestion.question_type === 'yes_no'" :class="$style.yesNoWrapper">
            <div :class="$style.yesNoTitle">
              <i class="fas fa-question-circle" :class="$style.yesNoTitleIcon"></i>
              <span :class="$style.yesNoTitleText">سؤال اختيار</span>
            </div>
            <div :class="$style.yesNoSubtitle">اختر الخيار الذي يناسب رأيك</div>
            <div :class="$style.yesNoContainer">
              <div :class="$style.yesNoButtons">
                <button
                  :class="[$style.yesNoButton, $style.yes, { [$style.selected]: answers[currentQuestion.id] === 'yes' }]"
                  @click="answers[currentQuestion.id] = 'yes'"
                  type="button"
                  :aria-pressed="answers[currentQuestion.id] === 'yes'"
                >
                  <i class="fas fa-check" :class="$style.yesNoButtonIcon"></i>
                  <span :class="$style.yesNoButtonText">نعم</span>
                  <div :class="$style.yesNoButtonBadge">
                    <i class="fas fa-check"></i>
                  </div>
                </button>
                <button
                  :class="[$style.yesNoButton, $style.no, { [$style.selected]: answers[currentQuestion.id] === 'no' }]"
                  @click="answers[currentQuestion.id] = 'no'"
                  type="button"
                  :aria-pressed="answers[currentQuestion.id] === 'no'"
                >
                  <i class="fas fa-times" :class="$style.yesNoButtonIcon"></i>
                  <span :class="$style.yesNoButtonText">لا</span>
                  <div :class="$style.yesNoButtonBadge">
                    <i class="fas fa-times"></i>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <!-- Error Message -->
          <div v-if="questionError" :class="$style.errorMessage">
            <i class="fas fa-exclamation-triangle"></i>
            <span>{{ questionError }}</span>
          </div>
        </div>
      </div>

      <!-- Email Collection Section -->
      <div v-if="shouldShowContactForm" :class="$style.contactSection">
        <div :class="$style.contactContainer">
          <div :class="$style.contactHeader">
            <h3 :class="$style.contactTitle">
              <i :class="getContactIcon()"></i>
              {{ getContactTitle() }}
            </h3>
            <p :class="$style.contactDescription">
              {{ getContactDescription() }}
            </p>
          </div>
          
          <!-- Email Input -->
          <div v-if="requiredContactMethod === 'email'" :class="$style.contactInputContainer">
            <div :class="$style.contactInputWrapper">
              <input
                type="email"
                :class="[$style.contactInput, { [$style.error]: contactError }]"
                v-model="userEmail"
                placeholder="example@domain.com"
                @input="contactError = ''"
              />
              <i class="fas fa-envelope" :class="$style.contactIcon"></i>
            </div>
            
            <div v-if="contactError" :class="$style.contactError">
              <i class="fas fa-exclamation-triangle"></i>
              <span>{{ contactError }}</span>
            </div>
          </div>

          <!-- Phone Input -->
          <div v-else-if="requiredContactMethod === 'phone'" :class="$style.contactInputContainer">
            <div :class="$style.phoneInputWrapper">
              <!-- Country Code Selector -->
              <div :class="$style.countrySelector" @click.stop>
                <button 
                  :class="$style.countryButton"
                  @click="showCountryDropdown = !showCountryDropdown"
                  type="button"
                >
                  <span :class="$style.countryFlag">{{ selectedCountry.flag }}</span>
                  <span :class="$style.countryCode">{{ selectedCountryCode }}</span>
                  <i class="fas fa-chevron-down" :class="$style.dropdownIcon"></i>
                </button>
                
                <!-- Country Dropdown -->
                <div v-if="showCountryDropdown" :class="$style.countryDropdown" @click.stop>
                  <div :class="$style.dropdownSearch">
                    <input 
                      type="text" 
                      :class="$style.searchInput"
                      placeholder="البحث عن دولة..."
                      @input="filterCountries"
                      @click.stop
                      ref="countrySearchInput"
                    />
                    <i class="fas fa-search" :class="$style.searchIcon"></i>
                  </div>
                  
                  <div :class="$style.countriesList">
                    <button
                      v-for="country in filteredCountries"
                      :key="country.code"
                      :class="[$style.countryOption, { [$style.selected]: selectedCountryCode === country.dialCode }]"
                      @click="selectCountry(country)"
                      type="button"
                    >
                      <span :class="$style.optionFlag">{{ country.flag }}</span>
                      <span :class="$style.optionName">{{ country.nameAr }}</span>
                      <span :class="$style.optionCode">{{ country.dialCode }}</span>
                    </button>
                  </div>
                </div>
              </div>
              
              <!-- Phone Number Input -->
              <div :class="$style.phoneInputContainer" :style="{ transform: 'translateY(10px)' }">
                <input
                  type="tel"
                  :class="[$style.phoneInput, { [$style.error]: contactError }]"
                  v-model="userPhone"
                  placeholder="123456789"
                  @input="contactError = ''"
                  @focus="showCountryDropdown = false"
                />
              </div>
            </div>
            
            <!-- Full Phone Display -->
            <div :class="$style.phonePreview">
              <span :class="$style.previewLabel">الرقم الكامل:</span>
              <span :class="$style.previewNumber">{{ fullPhoneNumber }}</span>
            </div>
            
            <div v-if="contactError" :class="$style.contactError">
              <i class="fas fa-exclamation-triangle"></i>
              <span>{{ contactError }}</span>
            </div>
          </div>
          
          <div :class="$style.contactNote">
            <i class="fas fa-shield-alt"></i>
            <span>بياناتك محمية ولن نشاركها مع أطراف خارجية</span>
          </div>
        </div>
      </div>

      <!-- Navigation -->
      <div :class="$style.formNavigation">
        <button
          v-if="currentQuestionIndex < (survey.questions?.length || 0) - 1"
          :class="[$style.navButton, $style.next]"
          @click="nextQuestion"
          :disabled="!canProceed"
        >
          <span>السؤال التالي</span>
          <i class="fas fa-arrow-left"></i>
        </button>

        <button
          v-if="currentQuestionIndex === (survey.questions?.length || 0) - 1"
          :class="[$style.navButton, $style.submit]"
          @click="submitSurvey"
          :disabled="!canSubmit || isSubmitting || !hasValidContactForSubmission"
        >
          <i v-if="isSubmitting" class="fas fa-spinner fa-spin"></i>
          <i v-else class="fas fa-paper-plane"></i>
          <span>{{ isSubmitting ? 'جاري الإرسال...' : 'إرسال الاستطلاع' }}</span>
        </button>

        <div :class="$style.navSpacer"></div>

        <button
          v-if="currentQuestionIndex > 0"
          :class="$style.navButton"
          @click="previousQuestion"
        >
          <i class="fas fa-arrow-right"></i>
          <span>السؤال السابق</span>
        </button>
      </div>
      </div>
      <!-- End of Single Question View -->
    </div>

    <!-- Error State -->
    <div v-else :class="$style.errorState">
      <div :class="$style.errorIcon">
        <i class="fas fa-exclamation-triangle"></i>
      </div>
      <h2 :class="$style.errorTitle">
        {{ isTimeoutError ? 'انتهت مهلة الاتصال' : 'حدث خطأ غير متوقع' }}
      </h2>
      <p :class="$style.errorMessage">
        {{ isTimeoutError 
          ? 'انتهت مهلة الاتصال بالخادم. يرجى المحاولة مرة أخرى.' 
          : 'عذراً، لم نتمكن من تحميل الاستطلاع. يرجى المحاولة مرة أخرى.' 
        }}
      </p>
      <button 
        v-if="isTimeoutError" 
        :class="$style.refreshButton" 
        @click="refreshPage"
        style="
          background: #007bff;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 16px;
          cursor: pointer;
          margin-top: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: background-color 0.2s;
        "
      >
        <i class="fas fa-sync-alt"></i>
        تحديث الصفحة
      </button>
    </div>

    <!-- Thank You Modal -->
    <ThankYouModal 
      :isVisible="showThankYouModal" 
      :isFromPublicSurvey="true"
      @close="handleModalClose" 
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '../../stores/useAppStore'
import { surveyService } from '../../services/surveyService'
import { ThankYouModal } from '../../components/ThankYouModal'
import { useInputValidation } from '../../composables/useInputValidation'
import type { Survey } from '../../types/survey.types'
import type { CountryCode } from '../../types/country.types'
import countryCodesData from '../../data/countryCodes.json'
import Swal from 'sweetalert2'

// Router
const route = useRoute()

// Store
const store = useAppStore()

// Composables
const {
  getInputConfig,
  validateAnswer,
  getValidationError,
  setValidationError,
  clearValidationError,
  handleBackendValidationErrors
} = useInputValidation()

// Computed
const currentTheme = computed(() => store.currentTheme)

// Constants for character limits
const MAX_TEXT_LENGTH = 400
const MAX_TEXTAREA_LENGTH = 2000

// State
const survey = ref<Survey | null>(null)
const isLoading = ref(true)
const accessDenied = ref(false)
const accessMessage = ref('')
const surveyData = ref<any>(null) // Store additional survey metadata from response
const surveyStarted = ref(false)
const currentQuestionIndex = ref(0)
const answers = ref<Record<string, any>>({})
const questionError = ref('')
const isSubmitting = ref(false)
const userEmail = ref('')
const userPhone = ref('')
const selectedCountryCode = ref('+971') // Default to UAE
const showCountryDropdown = ref(false)
const searchQuery = ref('')
const contactError = ref('')
const showContactForm = ref(false)
const showThankYouModal = ref(false)
const countrySearchInput = ref<HTMLInputElement | null>(null)
const isTimeoutError = ref(false)
const showAllQuestions = ref(true) // Default to show all questions (Google Forms style)

// Country codes data
const countryCodes: CountryCode[] = countryCodesData as CountryCode[]
const defaultCountry = countryCodes.find(country => country.dialCode === '+971') || countryCodes[0]

// Computed
const currentQuestion = computed(() => {
  if (!survey.value || !survey.value.questions) return null
  return survey.value.questions[currentQuestionIndex.value]
})

const progressPercentage = computed(() => {
  if (!survey.value) return 0
  return ((currentQuestionIndex.value + 1) / (survey.value.questions?.length || 1)) * 100
})

const canProceed = computed(() => {
  if (!currentQuestion.value) return false
  
  const answer = answers.value[currentQuestion.value.id]
  
  // If question is required, answer must be provided
  if (currentQuestion.value.is_required) {
    if (currentQuestion.value.question_type === 'multiple_choice') {
      return Array.isArray(answer) && answer.length > 0
    }
    return answer !== undefined && answer !== null && answer !== ''
  }
  
  // If not required, can always proceed
  return true
})

const canSubmit = computed(() => {
  if (!survey.value) return false
  
  // Check all required questions have answers
  for (const question of survey.value.questions) {
    if (question.is_required) {
      const answer = answers.value[question.id]
      if (question.question_type === 'multiple_choice') {
        if (!Array.isArray(answer) || answer.length === 0) return false
      } else {
        if (answer === undefined || answer === null || answer === '') return false
      }
    }
  }
  
  return true
})

const isValidEmail = computed(() => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(userEmail.value.trim())
})

const isValidPhone = computed(() => {
  // Extract only digits from the phone input
  const digits = userPhone.value.replace(/\D/g, '')
  
  // Set minimum length based on selected country
  // UAE (+971) requires 9 digits, others require at least 5
  const minLength = selectedCountryCode.value === '+971' ? 9 : 5
  const maxLength = 15
  
  return digits.length >= minLength && digits.length <= maxLength
})

const fullPhoneNumber = computed(() => {
  return selectedCountryCode.value + userPhone.value.trim().replace(/\s|-|[()]/g, '')
})

const requiredContactMethod = computed(() => {
  return survey.value?.public_contact_method || 'email'
})

// This is for form validation during submission
const hasValidContactForSubmission = computed(() => {
  // If per_device_access is true, contact information is not required
  if (survey.value?.per_device_access === true) {
    return true
  }
  
  if (requiredContactMethod.value === 'email') {
    return userEmail.value.trim() !== '' && isValidEmail.value
  } else if (requiredContactMethod.value === 'phone') {
    return userPhone.value.trim() !== '' && isValidPhone.value
  }
  return false
})

const filteredCountries = computed(() => {
  if (!searchQuery.value.trim()) {
    return countryCodes
  }
  
  const query = searchQuery.value.toLowerCase().trim()
  return countryCodes.filter(country => 
    country.nameAr.toLowerCase().includes(query) ||
    country.name.toLowerCase().includes(query) ||
    country.dialCode.includes(query)
  )
})

const selectedCountry = computed(() => {
  return countryCodes.find(country => country.dialCode === selectedCountryCode.value) || defaultCountry
})

const shouldShowContactForm = computed(() => {
  // If per_device_access is true, hide the contact form
  if (survey.value?.per_device_access === true) {
    return false
  }
  
  // Otherwise, show it on the last question or when explicitly requested
  return (currentQuestionIndex.value === (survey.value?.questions?.length || 0) - 1) || showContactForm.value
})

// Contact methods
const getContactIcon = () => {
  return requiredContactMethod.value === 'email' ? 'fas fa-envelope' : 'fas fa-phone'
}

const getContactTitle = () => {
  return requiredContactMethod.value === 'email' 
    ? 'البريد الإلكتروني (مطلوب)'
    : 'رقم الهاتف (مطلوب)'
}

const getContactDescription = () => {
  return requiredContactMethod.value === 'email'
    ? 'نحتاج بريدك الإلكتروني لحفظ إجاباتك وإرسال تأكيد المشاركة'
    : 'نحتاج رقم هاتفك لحفظ إجاباتك وإرسال تأكيد المشاركة'
}

// Phone country code functions
const selectCountry = (country: CountryCode) => {
  selectedCountryCode.value = country.dialCode
  showCountryDropdown.value = false
  searchQuery.value = ''
}

const filterCountries = (event: Event) => {
  const target = event.target as HTMLInputElement
  searchQuery.value = target.value
}

const closeCountryDropdown = () => {
  showCountryDropdown.value = false
  searchQuery.value = ''
}

// Methods
const loadSurvey = async () => {
  try {
    isLoading.value = true
    isTimeoutError.value = false
    const token = route.params.token as string

    if (!token) {
      accessDenied.value = true
      accessMessage.value = 'لم يتم العثور على رمز الوصول'
      return
    }

    // Create a timeout promise for 15 seconds
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('TIMEOUT')), 15000)
    })

    // Race between the API call and timeout
    const response = await Promise.race([
      surveyService.validateAccess(token),
      timeoutPromise
    ]) as any
    
    if (response.data.has_access && response.data.survey) {
      survey.value = response.data.survey
      // Initialize answers object
      initializeAnswers()
    } else {
      accessDenied.value = true
      // Store additional data for potential use (like dates)
      surveyData.value = response.data
      // Use the message from the API response if available
      accessMessage.value = response.message || 'ليس لديك صلاحية للوصول إلى هذا الاستطلاع'
    }
  } catch (error: any) {
    // Logging removed for production
    
    accessDenied.value = true
    
    // Check if it's a timeout error
    if (error.message === 'TIMEOUT') {
      isTimeoutError.value = true
      accessMessage.value = 'انتهت مهلة الاتصال بالخادم'
      return
    }
    
    // Extract message from error response
    let errorMessage = 'فشل في تحميل الاستطلاع'
    
    if (error.response?.data) {
      // Handle structured error response
      const errorData = error.response.data
      if (errorData.message) {
        errorMessage = errorData.message
      } else if (errorData.data?.message) {
        errorMessage = errorData.data.message
      }
    } else if (error.message) {
      errorMessage = error.message
    }
    
    accessMessage.value = errorMessage
  } finally {
    isLoading.value = false
  }
}

const refreshPage = () => {
  window.location.reload()
}

const initializeAnswers = () => {
  if (!survey.value) return
  
  const initialAnswers: Record<string, any> = {}
  survey.value.questions.forEach(question => {
    if (question.question_type === 'multiple_choice') {
      initialAnswers[question.id] = []
    } else {
      initialAnswers[question.id] = ''
    }
  })
  answers.value = initialAnswers
}

const startSurvey = () => {
  surveyStarted.value = true
  currentQuestionIndex.value = 0
  questionError.value = ''
}

const nextQuestion = () => {
  if (!validateCurrentQuestion()) return
  
  if (currentQuestionIndex.value < (survey.value?.questions.length || 0) - 1) {
    currentQuestionIndex.value++
    questionError.value = ''
  }
}

const previousQuestion = () => {
  if (currentQuestionIndex.value > 0) {
    currentQuestionIndex.value--
    questionError.value = ''
  }
}

const validateCurrentQuestion = (): boolean => {
  if (!currentQuestion.value) return false
  
  const answer = answers.value[currentQuestion.value.id]
  
  if (currentQuestion.value.is_required) {
    if (currentQuestion.value.question_type === 'multiple_choice') {
      if (!Array.isArray(answer) || answer.length === 0) {
        questionError.value = 'هذا السؤال مطلوب، يرجى الإجابة عليه'
        return false
      }
    } else {
      if (answer === undefined || answer === null || answer === '') {
        questionError.value = 'هذا السؤال مطلوب، يرجى الإجابة عليه'
        return false
      }
    }
  }
  
  questionError.value = ''
  return true
}

const handleInputBlur = (question: any) => {
  const answer = answers.value[question.id]
  const validationType = question.validation_type || 'none'
  
  if (validationType === 'none') {
    return
  }
  
  const result = validateAnswer(validationType, answer || '', question.is_required)
  
  if (!result.valid && result.error) {
    setValidationError(question.id, result.error)
  }
}

const validateContact = (): boolean => {
  if (!hasValidContactForSubmission.value) {
    if (requiredContactMethod.value === 'email') {
      if (userEmail.value.trim() === '') {
        contactError.value = 'البريد الإلكتروني مطلوب للمتابعة'
        return false
      }
      if (!isValidEmail.value) {
        contactError.value = 'يرجى إدخال بريد إلكتروني صحيح'
        return false
      }
    } else if (requiredContactMethod.value === 'phone') {
      if (userPhone.value.trim() === '') {
        contactError.value = 'رقم الهاتف مطلوب للمتابعة'
        return false
      }
      if (!isValidPhone.value) {
        // Dynamic error message based on selected country
        const minDigits = selectedCountryCode.value === '+971' ? 9 : 5
        contactError.value = selectedCountryCode.value === '+971' 
          ? 'يرجى إدخال رقم هاتف صحيح (9 أرقام للأرقام الإماراتية)'
          : `يرجى إدخال رقم هاتف صحيح (${minDigits} أرقام على الأقل)`
        return false
      }
    }
  }
  
  contactError.value = ''
  return true
}

const isOptionSelected = (questionId: string, option: string): boolean => {
  const answer = answers.value[questionId]
  return Array.isArray(answer) && answer.includes(option)
}

const toggleMultipleChoice = (questionId: string, option: string) => {
  if (!Array.isArray(answers.value[questionId])) {
    answers.value[questionId] = []
  }
  
  const currentAnswers = [...answers.value[questionId]]
  const index = currentAnswers.indexOf(option)
  
  if (index > -1) {
    currentAnswers.splice(index, 1)
  } else {
    currentAnswers.push(option)
  }
  
  answers.value[questionId] = currentAnswers
}

const submitSurvey = async () => {
  if (!canSubmit.value || isSubmitting.value) return
  
  // Skip contact validation if per_device_access is true
  if (survey.value?.per_device_access !== true) {
    // Validate contact information before submission
    if (!validateContact()) {
      showContactForm.value = true
      return
    }
  }
  
  try {
    isSubmitting.value = true
    
    // Prepare the submission data according to the new API specification
    const submissionData: any = {
      survey_id: survey.value!.id,
      answers: formatAnswersForSubmission()
    }

    // Add the appropriate contact method field only if not per_device_access
    if (survey.value?.per_device_access !== true) {
      if (requiredContactMethod.value === 'email') {
        submissionData.email = userEmail.value.trim()
      } else if (requiredContactMethod.value === 'phone') {
        submissionData.phone = fullPhoneNumber.value
      }
    }
    
    // Call the new anonymous response endpoint
    await surveyService.submitAnonymousResponse(submissionData)
    
    // Success - Show thank you modal
    showThankYouModal.value = true
    
  } catch (error: any) {
    // Handle backend validation errors
    if (error.response?.data?.data?.validation_errors) {
      handleBackendValidationErrors(error.response.data.data.validation_errors)
      Swal.fire({
        icon: 'error',
        title: 'خطأ في التحقق من صحة البيانات',
        text: 'يرجى تصحيح الأخطاء في الاستطلاع والمحاولة مرة أخرى',
        confirmButtonText: 'موافق'
      })
      return
    }
    
    // Handle specific API errors
    let errorMessage = 'فشل في إرسال الاستطلاع'
    
    if (error.message) {
      // Check for specific contact method errors
      if (error.message.includes('Email is required')) {
        contactError.value = 'البريد الإلكتروني مطلوب لهذا الاستطلاع'
        showContactForm.value = true
        return
      } else if (error.message.includes('Phone is required')) {
        contactError.value = 'رقم الهاتف مطلوب لهذا الاستطلاع'
        showContactForm.value = true
        return
      } else if (error.message.includes('already submitted')) {
        errorMessage = 'لقد قمت بإرسال إجابة لهذا الاستطلاع من قبل'
      } else {
        errorMessage = error.message
      }
    }
    
    Swal.fire({
      icon: 'error',
      title: 'خطأ في الإرسال',
      text: errorMessage,
      confirmButtonText: 'موافق'
    })
  } finally {
    isSubmitting.value = false
  }
}

const formatAnswersForSubmission = () => {
  const formattedAnswers: Array<{
    question_id: string
    answer: string | string[]
  }> = []
  
  Object.entries(answers.value).forEach(([questionId, answer]) => {
    // Only include answered questions
    if (answer !== '' && answer !== null && answer !== undefined) {
      if (Array.isArray(answer) && answer.length === 0) return
      
      formattedAnswers.push({
        question_id: questionId,
        answer: answer
      })
    }
  })
  
  return formattedAnswers
}

const copyLink = async () => {
  try {
    const currentUrl = window.location.href
    await navigator.clipboard.writeText(currentUrl)
    Swal.fire({
      icon: 'success',
      title: 'تم النسخ بنجاح',
      text: 'تم نسخ الرابط بنجاح!',
      confirmButtonText: 'موافق'
    })
  } catch (error) {
    // Logging removed for production
    Swal.fire({
      icon: 'error',
      title: 'خطأ في النسخ',
      text: 'فشل في نسخ الرابط',
      confirmButtonText: 'موافق'
    })
  }
}

const getRatingRange = (options: string | undefined): string => {
  if (!options) return '1 إلى 5'
  
  try {
    // Parse the JSON string to get the actual options array
    const optionsArray = typeof options === 'string' ? JSON.parse(options) : options
    
    if (!Array.isArray(optionsArray) || optionsArray.length === 0) return '1 إلى 5'
    
    // Convert options to numbers for proper sorting
    const numericOptions = optionsArray
      .map((opt: any) => Number(opt))
      .filter((num: number) => !isNaN(num))
    
    if (numericOptions.length === 0) return '1 إلى 5'
    
    const min = Math.min(...numericOptions)
    const max = Math.max(...numericOptions)
    
    return `${min} إلى ${max}`
  } catch (error) {
    // Logging removed for production
    return '1 إلى 5'
  }
}

const getRatingOptions = (options: string | undefined): any[] => {
  if (!options) return [1, 2, 3, 4, 5]
  
  try {
    // Parse the JSON string to get the actual options array
    const optionsArray = typeof options === 'string' ? JSON.parse(options) : options
    
    if (!Array.isArray(optionsArray) || optionsArray.length === 0) {
      return [1, 2, 3, 4, 5]
    }
    
    // Sort the options numerically if they are numbers
    const numericOptions = optionsArray
      .map((opt: any) => Number(opt))
      .filter((num: number) => !isNaN(num))
      .sort((a: number, b: number) => a - b)
    
    return numericOptions.length > 0 ? numericOptions : optionsArray
  } catch (error) {
    // Logging removed for production
    return [1, 2, 3, 4, 5]
  }
}

const getQuestionOptions = (options: string | undefined): string[] => {
  if (!options) return []
  
  try {
    // Parse the JSON string to get the actual options array
    const optionsArray = typeof options === 'string' ? JSON.parse(options) : options
    
    if (!Array.isArray(optionsArray)) {
      return []
    }
    
    return optionsArray.map((opt: any) => String(opt))
  } catch (error) {
    // Logging removed for production
    return []
  }
}

const getRatingLabel = (type: 'min' | 'max', questionOptions?: string): string => {
  // Use provided options or fall back to currentQuestion
  const options = questionOptions || currentQuestion.value?.options
  
  if (!options) {
    return type === 'min' ? 'ضعيف' : 'ممتاز'
  }
  
  try {
    // Parse the JSON string to get the actual options array
    const optionsArray = typeof options === 'string' 
      ? JSON.parse(options) 
      : options
      
    if (!Array.isArray(optionsArray) || optionsArray.length === 0) {
      return type === 'min' ? 'ضعيف' : 'ممتاز'
    }
    
    // Convert options to numbers for proper sorting
    const numericOptions = optionsArray
      .map((opt: any) => Number(opt))
      .filter((num: number) => !isNaN(num))
      .sort((a: number, b: number) => a - b)
    
    if (numericOptions.length === 0) {
      return type === 'min' ? 'ضعيف' : 'ممتاز'
    }
    
    // Dynamic labels based on the range
    const min = numericOptions[0]
    const max = numericOptions[numericOptions.length - 1]
    
    if (type === 'min') {
      if (min === 1) return 'ضعيف جداً'
      if (min === 0) return 'سيء'
      return `الأدنى (${min})`
    } else {
      if (max === 5) return 'ممتاز'
      if (max === 10) return 'مثالي'
      return `الأعلى (${max})`
    }
  } catch (error) {
    // Logging removed for production
    return type === 'min' ? 'ضعيف' : 'ممتاز'
  }
}

const handleModalClose = () => {
  showThankYouModal.value = false
  // Reset form
  surveyStarted.value = false
  userEmail.value = ''
  userPhone.value = ''
  selectedCountryCode.value = '+971'
  showCountryDropdown.value = false
  searchQuery.value = ''
  showContactForm.value = false
  // Optionally redirect or reload the page
}

// Character count helpers
const getMaxLength = (questionType: string): number => {
  return questionType === 'textarea' ? MAX_TEXTAREA_LENGTH : MAX_TEXT_LENGTH
}

const getCharacterCount = (questionId: string): number => {
  const answer = answers.value[questionId]
  return answer ? String(answer).length : 0
}

const getRemainingCharacters = (questionId: string, questionType: string): number => {
  const max = getMaxLength(questionType)
  const current = getCharacterCount(questionId)
  return max - current
}

const handleTextInput = (questionId: string, questionType: string, event: Event) => {
  const target = event.target as HTMLInputElement | HTMLTextAreaElement
  const maxLength = getMaxLength(questionType)
  
  // Prevent input if max length is exceeded
  if (target.value.length > maxLength) {
    target.value = target.value.substring(0, maxLength)
    answers.value[questionId] = target.value
  }
}

const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('ar', {
      calendar: 'gregory',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (error) {
    return dateString
  }
}

// Lifecycle
onMounted(() => {
  loadSurvey()
  
  // Add global click listener to close country dropdown
  const handleGlobalClick = () => {
    if (showCountryDropdown.value) {
      closeCountryDropdown()
    }
  }
  
  document.addEventListener('click', handleGlobalClick)
  
  // Cleanup on unmount
  const cleanup = () => {
    document.removeEventListener('click', handleGlobalClick)
  }
  
  // Store cleanup function for potential manual cleanup
  ;(window as any).__countryDropdownCleanup = cleanup
})
</script>

<style module src="./PublicSurveyView.module.css">
/* CSS Module styles are imported from PublicSurveyView.module.css */
</style>
