import * as vscode from 'vscode';

export type Language = 'pl' | 'en';

export function getLanguage(): Language {
  const lang = vscode.env.language.toLowerCase();
  return lang.startsWith('pl') ? 'pl' : 'en';
}

const translations = {
  en: {
    statusBarActive: 'Foundry Local is active',
    statusBarDisabled: 'Foundry Local inline completions are disabled',
    clickToOpenMenu: 'Click to open menu.',
    loadingModel: 'Preparing local model...',
    noModelResolved: 'No model resolved yet',
    
    // QuickPick Menu
    menuTitle: 'Foundry Local Quick Menu',
    openChatLabel: '$(comment-discussion) Open Chat',
    openChatDetail: 'Open chat input prefilled with @foundry-local',
    selectModelLabel: '$(symbol-enum-member) Select Model',
    selectModelDetail: 'Change the active Foundry Local model',
    selectModeLabel: '$(list-selection) Select Chat Mode',
    selectModeDetail: 'Choose mode: ask, plan, agent, explain, fix, refactor, tests',
    toggleCompletionsLabel: '$(sparkle) Toggle Inline Completions',
    toggleCompletionsDetailOn: 'Inline completions are ON. Click to disable.',
    toggleCompletionsDetailOff: 'Inline completions are OFF. Click to enable.',
    configureParamsLabel: '$(settings-gear) Configure Parameters',
    configureParamsDetail: 'Adjust temperature, token limits, context size, and debounce',
    showOutputLabel: '$(output) Show Output Logs',
    showOutputDetail: 'Open the Foundry Local output channel',

    // Select Mode
    selectModeTitle: 'Select Foundry Local Chat Mode',
    modeAskTitle: 'Ask',
    modeAskDesc: 'Answer directly using workspace context',
    modePlanTitle: 'Plan',
    modePlanDesc: 'Create an actionable implementation plan without modifying files',
    modeAgentTitle: 'Agent',
    modeAgentDesc: 'Inspect workspace and complete tasks using confirmed tools',
    modeExplainTitle: 'Explain',
    modeExplainDesc: 'Explain selected code or concept',
    modeFixTitle: 'Fix',
    modeFixDesc: 'Suggest minimal fix for code or errors',
    modeRefactorTitle: 'Refactor',
    modeRefactorDesc: 'Suggest code refactoring',
    modeTestsTitle: 'Tests',
    modeTestsDesc: 'Generate unit tests for selected code',

    // Configure Parameters
    configureParamsTitle: 'Configure Foundry Local Parameters',
    paramTemperatureTitle: 'Temperature',
    paramTemperatureDesc: 'Controls randomness (0.0 = deterministic, 1.0 = creative)',
    paramMaxTokensTitle: 'Max Output Tokens',
    paramMaxTokensDesc: 'Maximum response length per message',
    paramMaxContextTitle: 'Max Context Characters',
    paramMaxContextDesc: 'Maximum characters from workspace included in prompt',
    paramDebounceTitle: 'Inline Completion Debounce (ms)',
    paramDebounceDesc: 'Delay in milliseconds before inline completion is requested',

    promptEnterValue: 'Enter new value for {0} (current: {1}):',
    invalidNumber: 'Please enter a valid number.',
    valueUpdated: '{0} updated to {1}.',
    modelSetTo: 'Foundry Local model set to {0}.'
  },
  pl: {
    statusBarActive: 'Foundry Local jest aktywny',
    statusBarDisabled: 'Podpowiedzi inline Foundry Local są wyłączone',
    clickToOpenMenu: 'Kliknij, aby otworzyć menu.',
    loadingModel: 'Przygotowywanie lokalnego modelu...',
    noModelResolved: 'Nie wybrano jeszcze modelu',
    
    // QuickPick Menu
    menuTitle: 'Szybkie menu Foundry Local',
    openChatLabel: '$(comment-discussion) Otwórz czat',
    openChatDetail: 'Otwiera pole czatu z wpisanym @foundry-local',
    selectModelLabel: '$(symbol-enum-member) Wybierz model',
    selectModelDetail: 'Zmień aktywny model Foundry Local',
    selectModeLabel: '$(list-selection) Wybierz tryb czatu',
    selectModeDetail: 'Wybierz tryb: zapytaj, planuj, agent, wyjaśnij, napraw, refaktoryzuj, testy',
    toggleCompletionsLabel: '$(sparkle) Przełącz podpowiedzi inline',
    toggleCompletionsDetailOn: 'Podpowiedzi inline są WŁĄCZONE. Kliknij, aby wyłączyć.',
    toggleCompletionsDetailOff: 'Podpowiedzi inline są WYŁĄCZONE. Kliknij, aby włączyć.',
    configureParamsLabel: '$(settings-gear) Konfiguracja parametrów',
    configureParamsDetail: 'Dostosuj temperaturę, limit tokenów, kontekst i opóźnienie',
    showOutputLabel: '$(output) Pokaż logi wyjściowe',
    showOutputDetail: 'Otwórz kanał wyjściowy Foundry Local',

    // Select Mode
    selectModeTitle: 'Wybierz tryb czatu Foundry Local',
    modeAskTitle: 'Zapytaj (Ask)',
    modeAskDesc: 'Odpowiedź bezpośrednia na podstawie kontekstu obszaru roboczego',
    modePlanTitle: 'Planowanie (Plan)',
    modePlanDesc: 'Tworzenie planu wdrożenia bez modyfikowania plików',
    modeAgentTitle: 'Agent autonomiczny (Agent)',
    modeAgentDesc: 'Przeglądanie obszaru roboczego i wykonywanie zadań za pomocą narzędzi',
    modeExplainTitle: 'Wyjaśnienie (Explain)',
    modeExplainDesc: 'Szczegółowe wyjaśnienie wybranego kodu lub zagadnienia',
    modeFixTitle: 'Naprawa (Fix)',
    modeFixDesc: 'Propozycja minimalnej poprawki kodu lub błędów',
    modeRefactorTitle: 'Refaktoryzacja (Refactor)',
    modeRefactorDesc: 'Propozycja ulepszenia i czyszczenia kodu',
    modeTestsTitle: 'Testy (Tests)',
    modeTestsDesc: 'Generowanie testów jednostkowych dla wskazanego kodu',

    // Configure Parameters
    configureParamsTitle: 'Konfiguracja parametrów Foundry Local',
    paramTemperatureTitle: 'Temperatura (Temperature)',
    paramTemperatureDesc: 'Kontroluje losowość odpowiedzi (0.0 = precyzyjny, 1.0 = kreatywny)',
    paramMaxTokensTitle: 'Maks. liczba tokenów wyjściowych (Max Output Tokens)',
    paramMaxTokensDesc: 'Maksymalna długość pojedynczej odpowiedzi',
    paramMaxContextTitle: 'Maks. długość kontekstu w znakach (Max Context Characters)',
    paramMaxContextDesc: 'Maksymalna liczba znaków z pliku dołączana do promptu',
    paramDebounceTitle: 'Opóźnienie podpowiedzi inline w ms (Debounce)',
    paramDebounceDesc: 'Czas oczekiwania w ms przed wysłaniem zapytania o podpowiedź',

    promptEnterValue: 'Wprowadź nową wartość dla {0} (aktualna: {1}):',
    invalidNumber: 'Wprowadź poprawną liczbę.',
    valueUpdated: 'Parametr {0} został zmieniony na {1}.',
    modelSetTo: 'Model Foundry Local został zmieniony na {0}.'
  }
};

export function t(): typeof translations['en'] {
  const lang = getLanguage();
  return translations[lang];
}
