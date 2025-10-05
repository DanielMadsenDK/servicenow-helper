'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Settings as SettingsIcon, Eye, EyeOff, FileText, Lightbulb, Code2, Wrench, Check, X, Globe, Plus, DollarSign, Gift, ChevronDown, Image, Headphones, Bot, Zap, Server, Monitor, Filter } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { useSettings } from '@/contexts/SettingsContext';
import { useAIModels } from '@/contexts/AIModelContext';
import { useAgentModels } from '@/contexts/AgentModelContext';
import { useProviders } from '@/contexts/ProviderContext';

import BurgerMenu from './BurgerMenu';
import ThemeToggle from './ThemeToggle';
import AIModelModal from './AIModelModal';
import FilterModal, { type FilterSettings, type FilterOptions, type SortOption } from './FilterModal';

export default function Settings() {
  const router = useRouter();
  const { settings, isLoading, error, isAuthenticated, updateSetting } = useSettings();
  const { models } = useAIModels();
  const { agentModels, updateAgentModel, getDefaultAgents, isLoading: agentModelsLoading } = useAgentModels();
  const { providers, selectedProvider, setSelectedProvider, isLoading: providersLoading } = useProviders();
  const [saving, setSaving] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [urlInputValue, setUrlInputValue] = useState('');
  const [showModelModal, setShowModelModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [expandedAgents, setExpandedAgents] = useState<Record<string, boolean>>({});
  const [filterSettings, setFilterSettings] = useState<FilterSettings>({
    filters: {
      showFree: true,
      showPaid: true,
      showMultimodal: true
    },
    sort: {
      type: 'alphabetical',
      label: 'Alphabetical (A-Z)'
    }
  });

  // Initialize URL input value with current setting
  useEffect(() => {
    setUrlInputValue(settings.servicenow_instance_url || '');
  }, [settings.servicenow_instance_url]);

  // Initialize expanded agents with default state
  useEffect(() => {
    const defaultAgents = getDefaultAgents();
    const initialExpanded: Record<string, boolean> = {};
    defaultAgents.forEach(agent => {
      initialExpanded[agent.name] = false;
    });
    setExpandedAgents(initialExpanded);
  }, [getDefaultAgents]);

  // Filter and sort models based on current settings and selected provider
  const filteredAndSortedModels = useMemo(() => {
    let filteredModels = models.filter(model => {
      // First filter by selected provider
      if (selectedProvider && model.provider_id !== selectedProvider.id) {
        return false;
      }

      const isMultimodal = model.capabilities && model.capabilities.length > 0;
      const { showFree, showPaid, showMultimodal } = filterSettings.filters;

      // If no filters are active, show all models (that match the provider)
      if (!showFree && !showPaid && !showMultimodal) {
        return true;
      }

      // Check if model matches any of the selected filter criteria (OR logic)
      const matchesFreeFilter = showFree && model.is_free;
      const matchesPaidFilter = showPaid && !model.is_free;
      const matchesMultimodalFilter = showMultimodal && isMultimodal;

      // Model should be shown if it matches at least one active filter
      return matchesFreeFilter || matchesPaidFilter || matchesMultimodalFilter;
    });

    // Apply sorting
    if (filterSettings.sort.type === 'alphabetical') {
      filteredModels.sort((a, b) => {
        const nameA = (a.display_name || a.model_name).toLowerCase();
        const nameB = (b.display_name || b.model_name).toLowerCase();
        return nameA.localeCompare(nameB);
      });
    } else if (filterSettings.sort.type === 'dateAdded') {
      filteredModels.sort((a, b) => a.id - b.id);
    }

    return filteredModels;
  }, [models, filterSettings, selectedProvider]);

  const handleFilterApply = (newSettings: FilterSettings) => {
    setFilterSettings(newSettings);
  };

  const hasActiveFilters = () => {
    const { filters } = filterSettings;
    return !filters.showFree || !filters.showPaid || !filters.showMultimodal;
  };

  const handleToggle = async (key: keyof typeof settings, value: boolean) => {
    setSaving(key);
    setFeedback(null);
    
    try {
      await updateSetting(key, value);
      setFeedback({ type: 'success', message: 'Setting saved successfully!' });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      setFeedback({ 
        type: 'error', 
        message: err instanceof Error ? err.message : 'Failed to save setting' 
      });
      setTimeout(() => setFeedback(null), 5000);
    } finally {
      setSaving(null);
    }
  };

  const handleRequestTypeChange = async (value: 'documentation' | 'recommendation' | 'script' | 'troubleshoot') => {
    setSaving('default_request_type');
    setFeedback(null);
    
    try {
      await updateSetting('default_request_type', value);
      setFeedback({ type: 'success', message: 'Default request type saved!' });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      setFeedback({ 
        type: 'error', 
        message: err instanceof Error ? err.message : 'Failed to save setting' 
      });
      setTimeout(() => setFeedback(null), 5000);
    } finally {
      setSaving(null);
    }
  };

  const handleUrlSubmit = async (value: string) => {
    // Basic URL validation
    const trimmedValue = value.trim();
    
    if (trimmedValue && !trimmedValue.match(/^https?:\/\/.+/)) {
      setFeedback({ 
        type: 'error', 
        message: 'Please enter a valid URL starting with http:// or https://' 
      });
      setTimeout(() => setFeedback(null), 5000);
      return;
    }

    setSaving('servicenow_instance_url');
    setFeedback(null);
    
    try {
      await updateSetting('servicenow_instance_url', trimmedValue);
      setFeedback({ type: 'success', message: 'ServiceNow URL saved successfully!' });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      setFeedback({ 
        type: 'error', 
        message: err instanceof Error ? err.message : 'Failed to save URL' 
      });
      setTimeout(() => setFeedback(null), 5000);
    } finally {
      setSaving(null);
    }
  };

  const handleUrlKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleUrlSubmit(urlInputValue);
    }
  };

  const handleAgentModelChange = async (agentName: string, modelName: string) => {
    setSaving(`agent_${agentName}`);
    setFeedback(null);
    
    try {
      await updateAgentModel(agentName, modelName);
      setFeedback({ type: 'success', message: `${getAgentDisplayName(agentName)} model updated successfully!` });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      setFeedback({ 
        type: 'error', 
        message: err instanceof Error ? err.message : 'Failed to update agent model' 
      });
      setTimeout(() => setFeedback(null), 5000);
    } finally {
      setSaving(null);
    }
  };

  const toggleAgentExpanded = (agentName: string) => {
    setExpandedAgents(prev => ({
      ...prev,
      [agentName]: !prev[agentName]
    }));
  };

  const getAgentDisplayName = (agentName: string): string => {
    const agent = getDefaultAgents().find(a => a.name === agentName);
    return agent?.displayName || agentName;
  };

  const getAgentIcon = (agentName: string) => {
    switch (agentName) {
      case 'orchestration':
        return Zap;
      case 'business_rule':
        return Server;
      case 'client_script':
        return Monitor;
      case 'script_include':
        return Code2;
      default:
        return Bot;
    }
  };


  const handleModelModalSuccess = () => {
    setFeedback({ type: 'success', message: 'AI model added successfully!' });
    setTimeout(() => setFeedback(null), 3000);
  };

  const requestTypeOptions = [
    { value: 'recommendation' as const, label: 'Recommendation', icon: Lightbulb },
    { value: 'documentation' as const, label: 'Documentation', icon: FileText },
    { value: 'script' as const, label: 'Script', icon: Code2 },
    { value: 'troubleshoot' as const, label: 'Troubleshoot', icon: Wrench },
  ];

  const isModelMultimodal = (model: typeof models[0]) => {
    return model.capabilities && model.capabilities.length > 0;
  };

  const getCapabilityIcon = (capabilityName: string) => {
    switch (capabilityName) {
      case 'text':
        return FileText;
      case 'images':
        return Image;
      case 'audio':
        return Headphones;
      default:
        return FileText;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 relative">
      {/* Background Pattern */}
      <div className="absolute inset-0">
        {/* Light theme pattern */}
        <div className="absolute inset-0 opacity-30 dark:hidden" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, #64748b 1px, transparent 1px),
                           radial-gradient(circle at 75% 75%, #64748b 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
          backgroundPosition: '0 0, 25px 25px'
        }}></div>
        
        {/* Dark theme pattern */}
        <div className="absolute inset-0 opacity-15 hidden dark:block" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, #e0e7ff 0.8px, transparent 0.8px),
                           radial-gradient(circle at 75% 75%, #f0f9ff 0.8px, transparent 0.8px)`,
          backgroundSize: '50px 50px',
          backgroundPosition: '0 0, 25px 25px'
        }}></div>
      </div>

      {/* Header Bar */}
      <header className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 shadow-sm sticky top-0 z-50 relative">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.back()}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Go back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <SettingsIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              <h1 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-200 dark:to-slate-400 bg-clip-text text-transparent">
                Settings
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              <ThemeToggle />
              <BurgerMenu />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl relative z-10">
        {/* Feedback Messages */}
        {feedback && (
          <div className={`mb-6 p-4 rounded-xl border-2 flex items-center space-x-3 animate-in slide-in-from-top-4 fade-in-0 duration-300 ${
            feedback.type === 'success' 
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700 text-green-800 dark:text-green-200'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700 text-red-800 dark:text-red-200'
          }`}>
            {feedback.type === 'success' ? (
              <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
            ) : (
              <X className="w-5 h-5 text-red-600 dark:text-red-400" />
            )}
            <span className="font-medium">{feedback.message}</span>
          </div>
        )}

        {/* Authentication Warning */}
        {!isAuthenticated && !isLoading && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-700 rounded-xl p-6 mb-6">
            <div className="flex items-center space-x-3">
              <X className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              <span className="text-yellow-800 dark:text-yellow-200 font-medium">
                You are not authenticated. Settings will use defaults and cannot be saved.
              </span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-700 rounded-xl p-6 mb-6">
            <div className="flex items-center space-x-3">
              <X className="w-5 h-5 text-red-600 dark:text-red-400" />
              <span className="text-red-800 dark:text-red-200 font-medium">Failed to load settings: {error}</span>
            </div>
          </div>
        )}

        {/* Settings Content */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-lg border border-white/30 dark:border-gray-700/30 p-6 md:p-8">
          <div className="space-y-8">
            {/* Interface Settings */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Interface</h2>
              <div className="space-y-4">
                {/* Welcome Section Toggle */}
                <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-700/30">
                  <div className="flex items-center space-x-3">
                    {settings.welcome_section_visible ? (
                      <Eye className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    ) : (
                      <EyeOff className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    )}
                    <div>
                      <label className="text-gray-900 dark:text-gray-100 font-medium">Welcome Section</label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Show the welcome info box on the main page</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggle('welcome_section_visible', !settings.welcome_section_visible)}
                    disabled={saving === 'welcome_section_visible' || isLoading || !isAuthenticated}
                    className="flex items-center space-x-2"
                  >
                    {saving === 'welcome_section_visible' ? (
                      <div className="animate-spin w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full"></div>
                    ) : (
                      <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                        settings.welcome_section_visible ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                      }`}>
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                            settings.welcome_section_visible ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </div>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* ServiceNow Integration */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">ServiceNow Integration</h2>
              <div className="space-y-4">
                {/* ServiceNow Instance URL */}
                <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-700/30">
                  <div className="flex items-center space-x-3 mb-3">
                    <Globe className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <div>
                      <label className="text-gray-900 dark:text-gray-100 font-medium">Instance URL</label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Your ServiceNow instance URL for direct links</p>
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="url"
                      value={urlInputValue}
                      onChange={(e) => setUrlInputValue(e.target.value)}
                      onBlur={(e) => handleUrlSubmit(e.target.value)}
                      onKeyDown={handleUrlKeyDown}
                      disabled={saving === 'servicenow_instance_url' || isLoading || !isAuthenticated}
                      placeholder="https://your-instance.service-now.com"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    {saving === 'servicenow_instance_url' && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full"></div>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Example: https://mycompany.service-now.com (without trailing slash)
                  </p>
                </div>
              </div>
            </div>

            {/* Default Settings */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Defaults</h2>
              <div className="space-y-6">
                {/* Search Mode Default */}
                <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-700/30">
                  <div>
                    <label className="text-gray-900 dark:text-gray-100 font-medium">Search Mode</label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Default search mode setting for new sessions</p>
                  </div>
                  <button
                    onClick={() => handleToggle('default_search_mode', !settings.default_search_mode)}
                    disabled={saving === 'default_search_mode' || isLoading || !isAuthenticated}
                    className="flex items-center space-x-2"
                  >
                    {saving === 'default_search_mode' ? (
                      <div className="animate-spin w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full"></div>
                    ) : (
                      <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                        settings.default_search_mode ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                      }`}>
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                            settings.default_search_mode ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </div>
                    )}
                  </button>
                </div>

                {/* Default Request Type */}
                <div className="space-y-4">
                  <div>
                    <label className="text-gray-900 dark:text-gray-100 font-medium">Default Request Type</label>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">The default request type for new sessions</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {requestTypeOptions.map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        onClick={() => handleRequestTypeChange(value)}
                        disabled={saving === 'default_request_type' || isLoading || !isAuthenticated}
                        className={`p-4 rounded-xl border-2 transition-all duration-200 flex items-center space-x-3 shadow-sm hover:shadow-md transform hover:scale-105 hover:-translate-y-0.5 disabled:transform-none disabled:hover:scale-100 disabled:hover:translate-y-0 ${
                          settings.default_request_type === value
                            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                            : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-400'
                        }`}
                      >
                        {saving === 'default_request_type' && settings.default_request_type === value ? (
                          <div className="animate-spin w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full"></div>
                        ) : (
                          <Icon className="w-5 h-5" />
                        )}
                        <span className="font-medium">{label}</span>
                        {settings.default_request_type === value && saving !== 'default_request_type' && (
                          <Check className="w-4 h-4 ml-auto text-blue-600 dark:text-blue-400" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* AI Provider Selection */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">AI Provider</h2>
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-700/30">
                  <div className="flex items-center space-x-3 mb-4">
                    <Server className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <div>
                      <label className="text-gray-900 dark:text-gray-100 font-medium">Selected Provider</label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Choose your AI service provider</p>
                    </div>
                  </div>

                  {providersLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full"></div>
                      <span className="text-gray-600 dark:text-gray-400">Loading providers...</span>
                    </div>
                  ) : providers.length === 0 ? (
                    <div className="text-gray-500 dark:text-gray-400 text-sm">
                      No providers available. Please configure providers in the database.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {providers.map((provider) => (
                        <button
                          key={provider.id}
                          onClick={() => setSelectedProvider(provider)}
                          disabled={!isAuthenticated || !provider.is_active}
                          className={`p-4 rounded-xl border-2 transition-all duration-200 flex items-center space-x-3 shadow-sm hover:shadow-md transform hover:scale-105 hover:-translate-y-0.5 disabled:transform-none disabled:hover:scale-100 disabled:hover:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed ${
                            selectedProvider?.id === provider.id
                              ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                              : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-400'
                          } ${!provider.is_active ? 'opacity-50' : ''}`}
                        >
                          <Server className="w-5 h-5" />
                          <div className="flex-1 text-left">
                            <div className="font-medium">{provider.display_name}</div>
                            <div className="text-xs opacity-75">
                              {provider.is_active ? 'Active' : 'Inactive'}
                            </div>
                          </div>
                          {selectedProvider?.id === provider.id && (
                            <Check className="w-4 h-4 ml-auto text-blue-600 dark:text-blue-400" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {selectedProvider && (
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                      <div className="text-sm text-blue-800 dark:text-blue-200">
                        <div className="font-medium">Current Provider: {selectedProvider.display_name}</div>
                        <div className="text-xs mt-1 opacity-75">
                          Models below are filtered to show only {selectedProvider.display_name} models
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Agent Model Configuration */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">AI Agent Models</h2>
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-700/30">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <label className="text-gray-900 dark:text-gray-100 font-medium">Agent Model Configuration</label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Configure AI models for each specialized agent</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setShowFilterModal(true)}
                        disabled={!isAuthenticated}
                        className={`relative p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          hasActiveFilters()
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-gray-600 hover:text-blue-700 dark:text-gray-400 dark:hover:text-blue-300'
                        }`}
                        title="Filter and sort models"
                      >
                        <Filter className="w-5 h-5" />
                        {hasActiveFilters() && (
                          <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {Object.values(filterSettings.filters).filter(v => !v).length}
                          </span>
                        )}
                      </button>
                      <button
                        onClick={() => setShowModelModal(true)}
                        disabled={!isAuthenticated}
                        className="p-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Add new AI model"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {getDefaultAgents().map((agent) => {
                      const AgentIcon = getAgentIcon(agent.name);
                      const currentModel = agentModels[agent.name];
                      const selectedModel = models.find(m => m.model_name === currentModel);
                      const isExpanded = expandedAgents[agent.name];
                      const isSaving = saving === `agent_${agent.name}`;

                      return (
                        <div 
                          key={agent.name} 
                          className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden"
                        >
                          <button
                            onClick={() => toggleAgentExpanded(agent.name)}
                            disabled={agentModelsLoading || !isAuthenticated}
                            aria-expanded={isExpanded}
                            aria-controls={`agent-models-${agent.name}`}
                            aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${agent.displayName} model options`}
                            className="group w-full px-4 py-3 bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                          >
                            <div className="flex items-center space-x-3">
                              <AgentIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors" />
                              <div className="text-left">
                                <div
                                  id={`agent-${agent.name}-heading`}
                                  className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-800 dark:group-hover:text-blue-200 transition-colors"
                                >
                                  {agent.displayName}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">{agent.description}</div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {isSaving ? (
                                <div className="animate-spin w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full"></div>
                              ) : (
                                <>
                                  {selectedModel && (
                                    <div className="flex items-center space-x-1">
                                      {selectedModel.is_free ? (
                                        <Gift className="w-4 h-4 sm:w-3 sm:h-3 text-green-600 dark:text-green-400 group-hover:text-green-700 dark:group-hover:text-green-300 transition-colors" />
                                      ) : (
                                        <DollarSign className="w-4 h-4 sm:w-3 sm:h-3 text-yellow-600 dark:text-yellow-400 group-hover:text-yellow-700 dark:group-hover:text-yellow-300 transition-colors" />
                                      )}
                                      <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                                        {selectedModel.display_name || selectedModel.model_name}
                                      </span>
                                    </div>
                                  )}
                                  <ChevronDown className={`w-4 h-4 text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-all ${isExpanded ? 'rotate-180' : ''}`} />
                                </>
                              )}
                            </div>
                          </button>

                          {isExpanded && (
                            <div
                              id={`agent-models-${agent.name}`}
                              className="px-4 pt-3 pb-4 bg-gray-50 dark:bg-gray-700/50"
                              role="group"
                              aria-labelledby={`agent-${agent.name}-heading`}
                            >
                              <div className="space-y-3">
                                {filteredAndSortedModels.map((model) => (
                                  <button
                                    key={model.id}
                                    onClick={() => handleAgentModelChange(agent.name, model.model_name)}
                                    disabled={isSaving || !isAuthenticated}
                                    aria-label={`Select ${model.display_name || model.model_name} for ${agent.displayName}. ${model.is_free ? 'Free model' : 'Paid model'}${model.capabilities && model.capabilities.length > 0 ? ', multimodal capabilities' : ''}`}
                                    aria-pressed={currentModel === model.model_name}
                                    className={`group w-full px-4 py-3 rounded-lg text-left flex items-center justify-between transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                                      currentModel === model.model_name
                                        ? 'bg-blue-100 dark:bg-blue-800/50 border-2 border-blue-300 dark:border-blue-600 shadow-sm'
                                        : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-200 dark:hover:border-blue-700'
                                    }`}
                                  >
                                    <div className="flex items-center space-x-2">
                                      {model.is_free ? (
                                        <Gift className={`w-5 h-5 sm:w-4 sm:h-4 transition-colors ${
                                          currentModel === model.model_name
                                            ? 'text-green-800 dark:text-green-200'
                                            : 'text-green-600 dark:text-green-400 group-hover:text-green-700 dark:group-hover:text-green-300'
                                        }`} />
                                      ) : (
                                        <DollarSign className={`w-5 h-5 sm:w-4 sm:h-4 transition-colors ${
                                          currentModel === model.model_name
                                            ? 'text-yellow-800 dark:text-yellow-200'
                                            : 'text-yellow-600 dark:text-yellow-400 group-hover:text-yellow-700 dark:group-hover:text-yellow-300'
                                        }`} />
                                      )}
                                      <div className="flex items-center space-x-2 min-w-0">
                                        <span className={`text-sm font-medium truncate transition-colors ${
                                          currentModel === model.model_name
                                            ? 'text-blue-950 dark:text-blue-50'
                                            : 'text-gray-900 dark:text-gray-100 group-hover:text-blue-800 dark:group-hover:text-blue-200'
                                        }`}>
                                          {model.display_name || model.model_name}
                                        </span>
                                        {isModelMultimodal(model) && (
                                          <div className="flex items-center space-x-1">
                                            <span className={`text-xs font-medium transition-colors ${
                                              currentModel === model.model_name
                                                ? 'text-blue-800 dark:text-blue-200'
                                                : 'text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300'
                                            }`}>MultiModal</span>
                                            <div className="flex space-x-1">
                                              {model.capabilities?.map((cap) => {
                                                const IconComponent = getCapabilityIcon(cap.name);
                                                return (
                                                  <IconComponent
                                                    key={cap.id}
                                                    className={`w-4 h-4 sm:w-3 sm:h-3 transition-colors ${
                                                      currentModel === model.model_name
                                                        ? 'text-blue-800 dark:text-blue-200'
                                                        : 'text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300'
                                                    }`}
                                                  />
                                                );
                                              })}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    {currentModel === model.model_name && (
                                      <Check className="w-5 h-5 sm:w-4 sm:h-4 text-blue-800 dark:text-blue-200" />
                                    )}
                                  </button>
                                ))}
                                {filteredAndSortedModels.length === 0 && (
                                  <div className="px-3 py-2 text-gray-500 dark:text-gray-400 text-sm text-center">
                                    {models.length === 0
                                      ? "No AI models available. Add one using the + button above."
                                      : "No models match the current filters. Try adjusting your filter settings."
                                    }
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400 mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                    <div className="flex items-center space-x-1">
                      <Gift className="w-3 h-3 text-green-600 dark:text-green-400" />
                      <span>Free Model</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <DollarSign className="w-3 h-3 text-yellow-600 dark:text-yellow-400" />
                      <span>Paid Model</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Bot className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                      <span>Multimodal Model</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Model Modal */}
      <AIModelModal
        isOpen={showModelModal}
        onClose={() => setShowModelModal(false)}
        onSuccess={handleModelModalSuccess}
      />

      {/* Filter Modal */}
      <FilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApply={handleFilterApply}
        currentSettings={filterSettings}
      />
    </div>
  );
}