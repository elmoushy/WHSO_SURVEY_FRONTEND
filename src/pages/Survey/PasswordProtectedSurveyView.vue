<template>
  <div :class="$style.publicSurveyContainer" :data-theme="currentTheme" dir="rtl">
    <!-- Loading State -->
    <div v-if="isLoading" :class="$style.loadingContainer">
      <div :class="$style.loadingSpinner"></div>
      <p :class="$style.loadingText">جاري تحميل الاستطلاع...</p>
    </div>

    <!-- Password Access Form -->
    <div v-else-if="!isAuthenticated && !accessError" :class="$style.passwordAccessForm">
      <div :class="$style.accessCard">
        <div :class="$style.accessHeader">
          <div :class="$style.lockIconContainer">
            <div :class="$style.lockIcon">
              <i class="fas fa-shield-alt"></i>
            </div>
          </div>
          <h2 :class="$style.accessTitle">الاستطلاع محمي بكلمة مرور</h2>
          <p :class="$style.accessDescription">يرجى إدخال كلمة المرور والمعلومات المطلوبة للوصول إلى الاستطلاع</p>
        </div>

        <form :class="$style.accessForm" @submit.prevent="attemptAccess">
          <!-- Password Input -->
          <div :class="$style.inputGroup">
            <label :class="$style.inputLabel">
              <i class="fas fa-key"></i>
              كلمة المرور
            </label>
            <div :class="$style.inputWrapper">
              <input 
                type="password" 
                v-model="password"
                :class="[$style.textInput, { [$style.error]: passwordError }]"
                placeholder="أدخل كلمة المرور"
                @keydown.enter="attemptAccess"
              />
              <div :class="$style.inputFocus"></div>
            </div>
            <div v-if="passwordError" :class="$style.errorMessage">
              <i class="fas fa-exclamation-circle"></i>
              {{ passwordError }}
            </div>
          </div>

          <!-- Email Input (if required) -->
          <div v-if="requiresEmail" :class="$style.inputGroup">
            <label :class="$style.inputLabel">
              <i class="fas fa-envelope"></i>
              البريد الإلكتروني
            </label>
            <div :class="$style.inputWrapper">
              <input 
                type="email" 
                v-model="email"
                :class="[$style.textInput, { [$style.error]: emailError }]"
                placeholder="أدخل البريد الإلكتروني المطلوب"
                @keydown.enter="attemptAccess"
              />
              <div :class="$style.inputFocus"></div>
            </div>
            <div v-if="emailError" :class="$style.errorMessage">
              <i class="fas fa-exclamation-circle"></i>
              {{ emailError }}
            </div>
          </div>

          <!-- Phone Input (if required) -->
          <div v-if="requiresPhone" :class="$style.inputGroup">
            <label :class="$style.inputLabel">
              <i class="fas fa-phone"></i>
              رقم الهاتف
            </label>
            
            <!-- Country Code Selector -->
            <div :class="$style.phoneInputContainer">
              <div :class="$style.countrySelector" @click="showCountryDropdown = !showCountryDropdown">
                <span :class="$style.countryFlag">{{ selectedCountry.flag }}</span>
                <span :class="$style.countryCode">{{ selectedCountryCode }}</span>
                <i class="fas fa-chevron-down" :class="{ [$style.rotated]: showCountryDropdown }"></i>
                
                <!-- Country Dropdown -->
                <div v-if="showCountryDropdown" :class="$style.countryDropdown" @click.stop>
                  <div :class="$style.countrySearch">
                    <input
                      ref="countrySearchInput"
                      type="text"
                      :class="$style.searchInput"
                      placeholder="البحث..."
                      v-model="searchQuery"
                      @input="filterCountries"
                    />
                  </div>
                  <div :class="$style.countryList">
                    <div 
                      v-for="country in filteredCountries" 
                      :key="country.dialCode"
                      :class="$style.countryItem"
                      @click="selectCountry(country)"
                    >
                      <span :class="$style.countryFlag">{{ country.flag }}</span>
                      <span :class="$style.countryName">{{ country.nameAr }}</span>
                      <span :class="$style.countryCode">{{ country.dialCode }}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div :class="$style.inputWrapper">
                <input 
                  type="tel" 
                  v-model="phone"
                  :class="[$style.phoneInput, { [$style.error]: phoneError }]"
                  placeholder="أدخل رقم الهاتف"
                  @keydown.enter="attemptAccess"
                />
                <div :class="$style.inputFocus"></div>
              </div>
            </div>
            <div v-if="phoneError" :class="$style.errorMessage">
              <i class="fas fa-exclamation-circle"></i>
              {{ phoneError }}
            </div>
          </div>

          <!-- Access Error -->
          <div v-if="accessError" :class="$style.accessErrorMessage">
            <div :class="$style.errorIcon">
              <i class="fas fa-exclamation-triangle"></i>
            </div>
            <span>{{ accessError }}</span>
          </div>

          <!-- Access Button -->
          <button 
            type="submit"
            :class="[$style.accessButton, { [$style.loading]: isAccessAttempting }]"
            :disabled="isAccessAttempting || !isFormValid"
          >
            <div v-if="isAccessAttempting" :class="$style.loadingSpinner"></div>
            <i v-else class="fas fa-unlock-alt"></i>
            <span>دخول الاستطلاع</span>
          </button>
        </form>
      </div>
    </div>

    <!-- Survey Content (reuse from PublicSurveyView) -->
    <div v-else-if="survey && !surveyStarted" :class="$style.surveyContent">
      <!-- Survey Header -->
      <div :class="$style.surveyHeader">
        <div :class="$style.surveyBranding">
          <h1 :class="$style.surveyTitle">{{ survey.title }}</h1>
          <p :class="$style.surveyDescription">{{ survey.description }}</p>
        </div>
        
        <div :class="$style.surveyMeta">
          <div :class="$style.metaItem">
            <i class="fas fa-shield-alt"></i>
            <span>استطلاع محمي</span>
          </div>
          <div :class="$style.metaItem">
            <i class="fas fa-questions"></i>
            <span>{{ survey.questions?.length || 0 }} سؤال</span>
          </div>
        </div>
      </div>

      <!-- Welcome Section -->
      <div :class="$style.welcomeSection">
        <div :class="$style.welcomeContent">
          <h2 :class="$style.welcomeTitle">مرحباً بك في الاستطلاع</h2>
          <p :class="$style.welcomeText">
            نشكرك لمشاركتك في هذا الاستطلاع المحمي. إجاباتك مهمة بالنسبة لنا وستساعدنا في تحسين خدماتنا.
          </p>
          <ul :class="$style.welcomePoints">
            <li><i class="fas fa-check-circle"></i> جميع إجاباتك آمنة ومحمية</li>
            <li><i class="fas fa-clock"></i> سيستغرق الاستطلاع حوالي {{ Math.ceil((survey.questions?.length || 0) * 0.5) }} دقائق</li>
            <li><i class="fas fa-user-shield"></i> المشاركة بموافقتك الكاملة</li>
          </ul>
        </div>
      </div>

      <!-- Action Buttons -->
      <div :class="$style.actionButtons">
        <button :class="$style.startButton" @click="startSurvey">
          <i class="fas fa-play"></i>
          بدء الاستطلاع
        </button>
      </div>
    </div>

    <!-- Survey Form (When Started) -->
    <div v-else-if="survey && surveyStarted" :class="$style.surveyForm">
      <!-- Survey Form Header -->
      <div :class="$style.formHeader">
        <div :class="$style.formTitleSection">
          <h2 :class="$style.formTitle">{{ survey.title }}</h2>
          <p :class="$style.formSubtitle">استطلاع محمي</p>
        </div>
        
        <!-- View Mode Toggle -->
        <div :class="$style.viewModeToggle">
          <button 
            :class="[$style.toggleButton, { [$style.active]: showAllQuestions }]"
            @click="showAllQuestions = true"
          >
            <i class="fas fa-list"></i>
            <span>جميع الأسئلة</span>
          </button>
          <button 
            :class="[$style.toggleButton, { [$style.active]: !showAllQuestions }]"
            @click="showAllQuestions = false"
          >
            <i class="fas fa-step-forward"></i>
            <span>سؤال بسؤال</span>
          </button>
        </div>
        
        <div v-if="!showAllQuestions" :class="$style.progressSection">
          <div :class="$style.progressBar">
            <div :class="$style.progressFill" :style="{ width: `${progressPercentage}%` }"></div>
          </div>
          <span :class="$style.progressText">{{ currentQuestionIndex + 1 }} من {{ survey.questions?.length || 0 }}</span>
        </div>
      </div>

      <!-- All Questions View (Google Forms Style) -->
      <div v-if="showAllQuestions" :class="$style.allQuestionsContainer">
        <div 
          v-for="(question, qIndex) in survey.questions" 
          :key="question.id"
          :class="$style.currentQuestion"
        >
          <div :class="$style.questionHeader">
            <div :class="$style.questionBadge">
              <span :class="$style.questionIndex">{{ qIndex + 1 }}</span>
            </div>
            <h2 :class="$style.questionTitle">
              {{ question.text }}
              <span v-if="question.is_required" :class="$style.required">*</span>
            </h2>
            <div v-if="question.is_required" :class="$style.requiredNote">
              <i class="fas fa-star"></i>
              <span>هذا السؤال مطلوب</span>
            </div>
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
            <div :class="$style.choicesTitle">
              <i class="fas fa-dot-circle"></i>
              <span>اختر إجابة واحدة:</span>
            </div>
            <div
              v-for="(option, index) in getQuestionOptions(question.options)"
              :key="index"
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
            <div :class="$style.choicesTitle">
              <i class="fas fa-check-square"></i>
              <span>يمكنك اختيار أكثر من إجابة:</span>
            </div>
            <div
              v-for="(option, index) in getQuestionOptions(question.options)"
              :key="index"
              :class="[$style.choiceOption, { [$style.multiSelected]: Array.isArray(answers[question.id]) && answers[question.id].includes(option) }]"
              @click="toggleMultipleChoice(question.id, option)"
            >
              <div :class="$style.choiceCheckbox">
                <i v-if="Array.isArray(answers[question.id]) && answers[question.id].includes(option)" class="fas fa-check"></i>
              </div>
              <span :class="$style.choiceText">{{ option }}</span>
            </div>
          </div>

          <!-- Rating -->
          <div v-else-if="question.question_type === 'rating'" :class="$style.ratingContainer">
            <div :class="$style.ratingTitle">
              <i class="fas fa-star"></i>
              <span>قيم من {{ getRatingRange(question.options) }}:</span>
            </div>
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
          <div v-else-if="question.question_type === 'yes_no'" :class="$style.yesNoContainer">
            <button
              :class="[$style.yesNoButton, $style.yesButton, { [$style.selected]: answers[question.id] === 'yes' }]"
              @click="answers[question.id] = 'yes'"
            >
              <i class="fas fa-check-circle"></i>
              <span>نعم</span>
            </button>
            <button
              :class="[$style.yesNoButton, $style.noButton, { [$style.selected]: answers[question.id] === 'no' }]"
              @click="answers[question.id] = 'no'"
            >
              <i class="fas fa-times-circle"></i>
              <span>لا</span>
            </button>
          </div>
        </div>

        <!-- Contact Form (All Questions View) -->
        <div v-if="survey.public_contact_method" :class="$style.currentQuestion">
          <div :class="$style.questionHeader">
            <div :class="$style.questionBadge">
              <i class="fas fa-id-card"></i>
            </div>
            <h2 :class="$style.questionTitle">معلومات الاتصال</h2>
            <p :class="$style.contactNote">
              <i class="fas fa-info-circle"></i>
              <span>يرجى تقديم معلومات الاتصال الخاصة بك</span>
            </p>
          </div>

          <div :class="$style.contactFormContainer">
            <!-- Email Field -->
            <div v-if="survey.public_contact_method === 'email'" :class="$style.contactField">
              <label :class="$style.contactLabel">
                <i class="fas fa-envelope"></i>
                <span>البريد الإلكتروني *</span>
              </label>
              <div :class="$style.inputWrapper">
                <input
                  type="email"
                  v-model="userEmail"
                  :class="[$style.textInput, { [$style.error]: contactError && !isValidEmail }]"
                  placeholder="example@domain.com"
                  @input="contactError = ''"
                />
                <i class="fas fa-at" :class="$style.inputIcon"></i>
              </div>
              <div v-if="contactError && !isValidEmail" :class="$style.contactErrorMessage">
                {{ contactError }}
              </div>
            </div>

            <!-- Phone Field -->
            <div v-else-if="survey.public_contact_method === 'phone'" :class="$style.contactField">
              <label :class="$style.contactLabel">
                <i class="fas fa-phone"></i>
                <span>رقم الهاتف *</span>
              </label>
              <div :class="$style.phoneInputGroup">
                <div :class="$style.countryCodeWrapper">
                  <select v-model="selectedCountryCode" :class="$style.countryCodeSelect">
                    <option
                      v-for="country in countryCodes"
                      :key="country.code"
                      :value="country.code"
                    >
                      {{ country.flag }} {{ country.dialCode }}
                    </option>
                  </select>
                  <i class="fas fa-chevron-down" :class="$style.selectIcon"></i>
                </div>
                <div :class="$style.inputWrapper">
                  <input
                    type="tel"
                    v-model="userPhone"
                    :class="[$style.phoneInput, { [$style.error]: contactError && !isValidPhone }]"
                    placeholder="501234567"
                    @input="contactError = ''"
                  />
                  <i class="fas fa-mobile-alt" :class="$style.inputIcon"></i>
                </div>
              </div>
              <div v-if="contactError && !isValidPhone" :class="$style.contactErrorMessage">
                {{ contactError }}
              </div>
            </div>
          </div>
        </div>

        <!-- Submit Button Container (All Questions View) -->
        <div :class="$style.submitContainer">
          <button
            :class="[$style.navButton, $style.submit]"
            @click="submitSurvey"
            :disabled="!canSubmit || isSubmitting || (!hasValidContactForSubmission && !isContactRestricted)"
          >
            <i v-if="isSubmitting" class="fas fa-spinner fa-spin"></i>
            <i v-else class="fas fa-paper-plane"></i>
            <span>{{ isSubmitting ? 'جاري الإرسال...' : 'إرسال الاستطلاع' }}</span>
          </button>
        </div>
      </div>

      <!-- Single Question View (One-by-one) -->
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

          <!-- Question Input Based on Type -->
          <div :class="$style.questionInput">
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
                <i class="fas fa-pen" :class="$style.inputIcon"></i>
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

            <!-- Textarea -->
            <div v-else-if="currentQuestion.question_type === 'textarea'" :class="$style.inputContainer">
              <div :class="$style.inputWrapper">
                <textarea
                  v-model="answers[currentQuestion.id]"
                  :class="$style.textArea"
                  :maxlength="getMaxLength('textarea')"
                  @input="(e) => { if (currentQuestion) handleTextInput(currentQuestion.id, 'textarea', e); }"
                  placeholder="اكتب إجابتك المفصلة هنا... يمكنك كتابة عدة أسطر"
                  rows="4"
                ></textarea>
                <i class="fas fa-align-right" :class="$style.inputIcon"></i>
              </div>
              <div :class="$style.characterCount" :data-warning="getRemainingCharacters(currentQuestion.id, 'textarea') < 200">
                <span>{{ getCharacterCount(currentQuestion.id) }} / {{ getMaxLength('textarea') }}</span>
                <span v-if="getRemainingCharacters(currentQuestion.id, 'textarea') < 200" :class="$style.remainingWarning">
                  ({{ getRemainingCharacters(currentQuestion.id, 'textarea') }} حrف متبقي)
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
                v-for="option in getQuestionOptions(currentQuestion.options)" 
                :key="option"
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
                v-for="option in getQuestionOptions(currentQuestion.options)" 
                :key="option"
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
          </div>

          <!-- Validation Error -->
          <div v-if="questionError" :class="$style.errorMessage">
            <i class="fas fa-exclamation-triangle"></i>
            <span>{{ questionError }}</span>
          </div>
        </div>
      </div>

      <!-- Email/Phone Collection Section (if needed) -->
      <div v-if="(currentQuestionIndex === (survey.questions?.length || 0) - 1 || showContactForm) && !isContactRestricted" :class="$style.contactSection">
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
          <div v-if="requiredContactMethod === 'email'" :class="$style.contactInputGroup">
            <input
              type="email"
              v-model="userEmail"
              :class="[$style.contactInput, { [$style.error]: contactError && !isValidEmail }]"
              placeholder="your-email@example.com"
              @input="contactError = ''"
            />
            <div v-if="contactError && !isValidEmail" :class="$style.contactErrorMessage">
              {{ contactError }}
            </div>
          </div>

          <!-- Phone Input -->
          <div v-else-if="requiredContactMethod === 'phone'" :class="$style.phoneContactGroup">
            <div :class="$style.phoneInputContainer">
              <div :class="$style.countrySelector" @click="showCountryDropdown = !showCountryDropdown">
                <span :class="$style.countryFlag">{{ selectedCountry.flag }}</span>
                <span :class="$style.countryCode">{{ selectedCountryCode }}</span>
                <i class="fas fa-chevron-down" :class="{ [$style.rotated]: showCountryDropdown }"></i>
                
                <!-- Country Dropdown -->
                <div v-if="showCountryDropdown" :class="$style.countryDropdown" @click.stop>
                  <div :class="$style.countrySearch">
                    <input
                      ref="countrySearchInput"
                      type="text"
                      :class="$style.searchInput"
                      placeholder="البحث..."
                      v-model="searchQuery"
                      @input="filterCountries"
                    />
                  </div>
                  <div :class="$style.countryList">
                    <div 
                      v-for="country in filteredCountries" 
                      :key="country.dialCode"
                      :class="$style.countryItem"
                      @click="selectCountry(country)"
                    >
                      <span :class="$style.countryFlag">{{ country.flag }}</span>
                      <span :class="$style.countryName">{{ country.nameAr }}</span>
                      <span :class="$style.countryCode">{{ country.dialCode }}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <input
                type="tel"
                v-model="userPhone"
                :class="[$style.phoneInput, { [$style.error]: contactError && !isValidPhone }]"
                placeholder="501234567"
                @input="contactError = ''"
              />
            </div>
            <div v-if="contactError && !isValidPhone" :class="$style.contactErrorMessage">
              {{ contactError }}
            </div>
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
          :disabled="!canSubmit || isSubmitting || (!hasValidContactForSubmission && !isContactRestricted)"
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
    <div v-else-if="accessError && !isAuthenticated" :class="$style.errorState">
      <div :class="$style.errorIcon">
        <i :class="accessError === 'هذا الاستطلاع لم يعد متاحًا' ? 'fas fa-times-circle' : 'fas fa-exclamation-triangle'"></i>
      </div>
      <h2 :class="$style.errorTitle">
        {{ isTimeoutError ? 'انتهت مهلة الاتصال' : (accessError === 'هذا الاستطلاع لم يعد متاحًا' ? 'الاستطلاع غير متاح' : 'حدث خطأ غير متوقع') }}
      </h2>
      <p :class="$style.errorMessage">
        {{ isTimeoutError ? 'انتهت مهلة الاتصال بالخادم. يرجى المحاولة مرة أخرى.' : accessError }}
      </p>
      <button 
        v-if="isTimeoutError" 
        :class="$style.secondaryButton" 
        @click="refreshPage"
      >
        <i class="fas fa-sync-alt"></i>
        تحديث الصفحة
      </button>
    </div>

    <!-- Fallback Error State -->
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
        :class="$style.secondaryButton" 
        @click="refreshPage"
      >
        <i class="fas fa-sync-alt"></i>
        تحديث الصفحة
      </button>
    </div>

    <!-- Thank You Modal -->
    <ThankYouModal 
      :isVisible="showThankYouModal"
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
import type { Survey, PasswordProtectedResponseSubmission } from '../../types/survey.types'
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
const isAuthenticated = ref(false)
const isContactRestricted = ref(false) // Track if access was restricted by email/phone

// Password access state
const password = ref('')
const email = ref('')
const phone = ref('')
const passwordError = ref('')
const emailError = ref('')
const phoneError = ref('')
const accessError = ref('')
const isAccessAttempting = ref(false)
const requiresEmail = ref(false)
const requiresPhone = ref(false)

// Survey form state (reuse from PublicSurveyView)
const surveyStarted = ref(false)
const showAllQuestions = ref(true) // Default to showing all questions like Google Forms
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

// Country codes data
const countryCodes: CountryCode[] = countryCodesData as CountryCode[]
const defaultCountry = countryCodes.find(country => country.dialCode === '+971') || countryCodes[0]

// Computed properties (reuse from PublicSurveyView)
const currentQuestion = computed(() => {
  if (!survey.value || !survey.value.questions) return null
  return survey.value.questions[currentQuestionIndex.value]
})

const progressPercentage = computed(() => {
  if (!survey.value) return 0
  return ((currentQuestionIndex.value + 1) / (survey.value.questions?.length || 1)) * 100
})

const isFormValid = computed(() => {
  if (!password.value.trim()) return false
  if (requiresEmail.value && !email.value.trim()) return false
  if (requiresPhone.value && !phone.value.trim()) return false
  return true
})

const canProceed = computed(() => {
  if (!currentQuestion.value) return false
  
  const answer = answers.value[currentQuestion.value.id]
  
  if (currentQuestion.value.is_required) {
    if (currentQuestion.value.question_type === 'multiple_choice') {
      return Array.isArray(answer) && answer.length > 0
    }
    return answer !== undefined && answer !== null && answer !== ''
  }
  
  return true
})

const canSubmit = computed(() => {
  if (!survey.value) return false
  
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
  const digits = userPhone.value.replace(/\D/g, '')
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

const hasValidContactForSubmission = computed(() => {
  if (isContactRestricted.value) return true // Already validated during access
  
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

// Methods
const checkSurveyAvailability = async () => {
  try {
    isLoading.value = true
    isTimeoutError.value = false
    const token = route.params.token as string

    if (!token) {
      accessError.value = 'لم يتم العثور على رمز الوصول'
      return
    }

    // Create a timeout promise for 15 seconds
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('TIMEOUT')), 15000)
    })

    // Check survey availability using hardcoded password "111"
    try {
      const accessData = {
        password: "111"
      }
      
      // Race between the API call and timeout
      await Promise.race([
        surveyService.validatePasswordAccessByToken(token, accessData),
        timeoutPromise
      ])
      // If we reach here without error, the survey exists and password validation worked
      // This means the survey is available but needs the correct password
      
    } catch (error: any) {
      // Check if it's a timeout error
      if (error.message === 'TIMEOUT') {
        isTimeoutError.value = true
        accessError.value = 'انتهت مهلة الاتصال بالخادم'
        return
      }
      
      if (error.response?.status === 404) {
        // Survey not found - show "survey no longer available" message
        accessError.value = 'هذا الاستطلاع لم يعد متاحًا'
        return
      } else if (error.response?.status === 401) {
        // Unauthorized - survey exists but password is wrong (which is expected)
        // This means the survey is available and needs authentication
        // Continue to show the password form
      } else {
        // Other error - show generic error
        accessError.value = 'فشل في التحقق من حالة الاستطلاع'
        return
      }
    }
    
  } catch (error: any) {
    // Check if it's a timeout error
    if (error.message === 'TIMEOUT') {
      isTimeoutError.value = true
      accessError.value = 'انتهت مهلة الاتصال بالخادم'
      return
    }
    
    accessError.value = 'فشل في التحقق من متطلبات الوصول'
  } finally {
    isLoading.value = false
  }
}

const refreshPage = () => {
  window.location.reload()
}

const attemptAccess = async () => {
  try {
    isAccessAttempting.value = true
    isTimeoutError.value = false
    clearErrors()

    const token = route.params.token as string
    if (!token) {
      accessError.value = 'لم يتم العثور على رمز الوصول'
      return
    }

    if (!password.value.trim()) {
      passwordError.value = 'كلمة المرور مطلوبة'
      return
    }

    const accessData: any = {
      password: password.value.trim()
    }

    if (email.value.trim()) {
      accessData.email = email.value.trim()
    }

    if (phone.value.trim()) {
      accessData.phone = selectedCountryCode.value + phone.value.trim()
    }

    // Create a timeout promise for 15 seconds
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('TIMEOUT')), 15000)
    })

    // Race between the API call and timeout
    const response = await Promise.race([
      surveyService.validatePasswordAccessByToken(token, accessData),
      timeoutPromise
    ]) as any
    
    if (response.data.has_access) {
      // Store access info for submission later
      const accessInfo = response.data
      
      // Set contact restriction flag if email/phone was required for access
      if (email.value.trim() || phone.value.trim()) {
        isContactRestricted.value = true
      }
      
      // Now fetch the actual survey data using the provided endpoint
      const surveyId = accessInfo.survey_id
      const authToken = accessInfo.access_instructions.required_headers.Authorization.replace('Bearer ', '')
      
      // Store the auth token for later use in submissions
      sessionStorage.setItem('survey_auth_token', authToken)
      sessionStorage.setItem('survey_password', password.value.trim())
      
      // Apply timeout to survey data fetch as well
      const surveyResponse = await Promise.race([
        surveyService.getPasswordProtectedSurvey(surveyId, authToken, password.value.trim()),
        timeoutPromise
      ]) as any
      
      survey.value = surveyResponse.data
      isAuthenticated.value = true
      
      initializeAnswers()
    } else {
      accessError.value = 'لا يمكن الوصول إلى هذا الاستطلاع'
    }

  } catch (error: any) {
    // Check if it's a timeout error
    if (error.message === 'TIMEOUT') {
      isTimeoutError.value = true
      accessError.value = 'انتهت مهلة الاتصال بالخادم'
      return
    }
    
    if (error.response?.data) {
      const errorData = error.response.data
      
      if (errorData.message) {
        if (errorData.message.includes('email is required')) {
          requiresEmail.value = true
          emailError.value = 'البريد الإلكتروني مطلوب للوصول إلى هذا الاستطلاع'
        } else if (errorData.message.includes('phone is required')) {
          requiresPhone.value = true
          phoneError.value = 'رقم الهاتف مطلوب للوصول إلى هذا الاستطلاع'
        } else if (errorData.message.includes('password')) {
          passwordError.value = 'كلمة المرور غير صحيحة'
        } else if (errorData.message.includes('email')) {
          emailError.value = 'البريد الإلكتروني غير صحيح أو غير مخول للوصول'
        } else if (errorData.message.includes('phone')) {
          phoneError.value = 'رقم الهاتف غير صحيح أو غير مخول للوصول'
        } else {
          accessError.value = errorData.message
        }
      } else {
        accessError.value = 'فشل في الوصول إلى الاستطلاع'
      }
    } else {
      accessError.value = 'حدث خطأ غير متوقع'
    }
  } finally {
    isAccessAttempting.value = false
  }
}

const clearErrors = () => {
  passwordError.value = ''
  emailError.value = ''
  phoneError.value = ''
  accessError.value = ''
}

// Survey form methods (reuse from PublicSurveyView)
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
        questionError.value = 'يرجى اختيار خيار واحد على الأقل'
        return false
      }
    } else {
      if (answer === undefined || answer === null || answer === '') {
        questionError.value = 'هذا السؤال مطلوب'
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
  if (isContactRestricted.value) return true // Already validated
  
  if (requiredContactMethod.value === 'email') {
    if (userEmail.value.trim() === '') {
      contactError.value = 'البريد الإلكتروني مطلوب'
      return false
    }
    if (!isValidEmail.value) {
      contactError.value = 'يرجى إدخال بريد إلكتروني صحيح'
      return false
    }
  } else if (requiredContactMethod.value === 'phone') {
    if (userPhone.value.trim() === '') {
      contactError.value = 'رقم الهاتف مطلوب'
      return false
    }
    if (!isValidPhone.value) {
      contactError.value = 'يرجى إدخال رقم هاتف صحيح'
      return false
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
  
  if (!isContactRestricted.value && !validateContact()) {
    showContactForm.value = true
    return
  }
  
  try {
    isSubmitting.value = true
    
    const submissionData: PasswordProtectedResponseSubmission = {
      survey_id: survey.value!.id,
      token: route.params.token as string,
      password: password.value,
      answers: formatAnswersForSubmission()
    }

    // Add contact info if not already restricted
    if (!isContactRestricted.value) {
      if (requiredContactMethod.value === 'email') {
        submissionData.email = userEmail.value.trim()
      } else if (requiredContactMethod.value === 'phone') {
        submissionData.phone = fullPhoneNumber.value
      }
    } else {
      // Use the contact info from access
      if (email.value) submissionData.email = email.value
      if (phone.value) submissionData.phone = selectedCountryCode.value + phone.value
    }
    
    await surveyService.submitPasswordProtectedResponse(submissionData)
    
    // Success
    showThankYouModal.value = true
    
  } catch (error: any) {
    // Handle backend validation errors
    if (error.response?.data?.data?.validation_errors) {
      handleBackendValidationErrors(error.response.data.data.validation_errors)
      await Swal.fire({
        title: 'خطأ في التحقق من صحة البيانات',
        text: 'يرجى تصحيح الأخطاء في الاستطلاع والمحاولة مرة أخرى',
        icon: 'error',
        confirmButtonText: 'موافق'
      })
      return
    }

    let errorMessage = 'فشل في إرسال الاستطلاع'
    
    // Check for 403 Forbidden status
    if (error.response?.status === 403) {
      errorMessage = 'هذا الشخص غير مصرح له بارسال الاجابات'
    } else if (error.message) {
      if (error.message.includes('already submitted')) {
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

// Utility methods (reuse from PublicSurveyView)
const getQuestionOptions = (options: string | undefined): string[] => {
  if (!options) return []
  
  try {
    const optionsArray = typeof options === 'string' ? JSON.parse(options) : options
    
    if (!Array.isArray(optionsArray)) {
      return []
    }
    
    return optionsArray.map((opt: any) => String(opt))
  } catch (error) {
    return []
  }
}

const getRatingOptions = (options: string | undefined): any[] => {
  if (!options) return [1, 2, 3, 4, 5]
  
  try {
    const optionsArray = typeof options === 'string' ? JSON.parse(options) : options
    
    if (!Array.isArray(optionsArray) || optionsArray.length === 0) {
      return [1, 2, 3, 4, 5]
    }
    
    return optionsArray.length > 0 ? optionsArray : optionsArray
  } catch (error) {
    return [1, 2, 3, 4, 5]
  }
}

const getRatingLabel = (type: 'min' | 'max', questionOptions?: string): string => {
  const optionsToUse = questionOptions || currentQuestion.value?.options
  
  if (!optionsToUse) {
    return type === 'min' ? 'ضعيف' : 'ممتاز'
  }
  
  try {
    const optionsArray = typeof optionsToUse === 'string' 
      ? JSON.parse(optionsToUse) : optionsToUse
      
    if (!Array.isArray(optionsArray) || optionsArray.length === 0) {
      return type === 'min' ? 'ضعيف' : 'ممتاز'
    }
    
    const numericOptions = optionsArray
    
    if (numericOptions.length === 0) {
      return type === 'min' ? 'ضعيف' : 'ممتاز'
    }
    
    const min = numericOptions[0]
    const max = numericOptions[numericOptions.length - 1]
    
    if (type === 'min') {
      return `الأدنى (${min})`
    } else {
      return `الأعلى (${max})`
    }
  } catch (error) {
    return type === 'min' ? 'ضعيف' : 'ممتاز'
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

// Country/phone methods
const selectCountry = (country: CountryCode) => {
  selectedCountryCode.value = country.dialCode
  showCountryDropdown.value = false
  searchQuery.value = ''
}

const filterCountries = (event: Event) => {
  const target = event.target as HTMLInputElement
  searchQuery.value = target.value
}

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

// Lifecycle
onMounted(() => {
  checkSurveyAvailability()
  
  // Global click listener for country dropdown
  const handleGlobalClick = () => {
    if (showCountryDropdown.value) {
      showCountryDropdown.value = false
      searchQuery.value = ''
    }
  }
  
  document.addEventListener('click', handleGlobalClick)
  
  const cleanup = () => {
    document.removeEventListener('click', handleGlobalClick)
  }
  
  ;(window as any).__countryDropdownCleanup = cleanup
})
</script>

<style module src="../Survey/PublicSurveyView.module.css">
/* CSS Module styles are imported from PublicSurveyView.module.css */
</style>
