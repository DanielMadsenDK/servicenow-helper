# Usage Guide

This comprehensive guide covers all features and workflows for using the ServiceNow Helper application.

## Table of Contents

- [Getting Started](#getting-started)
- [Settings Configuration](#settings-configuration)
- [Multi-Provider AI Architecture](#multi-provider-ai-architecture)
- [Multi-Agent AI Configuration](#multi-agent-ai-configuration)
- [Asking Questions](#asking-questions)
- [File Attachments (Multimodal Support)](#file-attachments-multimodal-support)
- [Script Deployment to ServiceNow](#script-deployment-to-servicenow)
- [Mermaid Diagram Support](#mermaid-diagram-support)
- [Answer Export Functionality](#answer-export-functionality)
- [Knowledge Store Management](#knowledge-store-management)

---

## Getting Started

### Initial Steps

1. **Login** with your credentials to access the secure dashboard
2. **Configure** your preferences in the settings panel (accessible via hamburger menu)
3. **Customize** default search modes and request types
4. **Manage** your knowledge store entries via the dedicated management interface

### User Interface Overview

The main interface includes:
- **Search Interface**: Main area for asking questions
- **Results Section**: Real-time streaming AI responses
- **History Panel**: Access to previous conversations
- **Hamburger Menu**: Navigation to settings, knowledge store, and user manual
- **Theme Toggle**: Switch between light and dark modes

---

## Settings Configuration

Access the settings via the hamburger menu (☰) to personalize your experience.

### Available Settings

| Setting | Description | Options |
|---------|-------------|---------|
| **Welcome Section** | Toggle info box visibility | Show/Hide |
| **Default Search Mode** | Set preferred search behavior | On/Off |
| **Default Request Type** | Choose default category | Documentation, Recommendation, Script, Troubleshoot |
| **Multi-Provider Configuration** | Configure AI providers and models for specialized agents | Provider selection + Model assignment per agent |

### How to Access Settings

1. Click the **hamburger menu** (☰) in the top-left corner
2. Select **Settings** from the menu
3. Adjust your preferences
4. Changes are automatically saved to your user profile

---

## Multi-Provider AI Architecture

The ServiceNow Helper supports multiple AI providers for cost optimization and model diversity.

### Supported Providers

| Provider | Purpose | Supported Models | Cost |
|----------|---------|------------------|------|
| **OpenRouter** | Primary provider with extensive model catalog | Claude, GPT, Gemini, Llama, and 200+ models | Varies by model |
| **Hugging Face** | Open-source and cost-effective models | Open-source models, custom fine-tuned models | Free and paid tiers |
| **Extensible System** | Add custom providers via database configuration | Any API-compatible provider | Configurable |

### Provider Configuration

**Database Setup:**
- Providers are configured in the `providers` table with endpoint URLs
- See [Database Configuration](./DATABASE.md) for detailed setup instructions

**API Key Management:**
- Environment variables follow pattern `{PROVIDER_NAME}_API_KEY`
- Example: `OPENROUTER_API_KEY`, `HUGGINGFACE_API_KEY`

**Model Assignment:**
- Each AI agent can use models from different providers
- Configure in Settings → Agent Models section

**Cost Optimization:**
- Mix free and paid models based on task complexity
- Use cost-effective models for simple tasks
- Reserve premium models for complex operations

---

## Multi-Agent AI Configuration

Configure different AI models from multiple providers for specialized agents to optimize performance.

### Available Agents

| Agent | Purpose | Complexity | Configurable Models |
|-------|---------|-----------|-----|
| **Orchestration Agent** | Coordinates overall response and routing | N/A | Claude, GPT, Gemini, and more |
| **Planner Agent** | Analyzes requirements and designs solutions | Large: Complex strategy; Small: Well-defined tasks | Claude, GPT, Gemini, and more |
| **Coder Agent** | Generates scripts, code, and implementations | Large: Complex code; Small: Simple snippets | Claude, GPT, Gemini, and more |
| **Architect Agent** | Designs system architecture and frameworks | Large: Complex design; Small: Well-defined architecture | Claude, GPT, Gemini, and more |
| **Process SME Agent** | Provides expertise on workflows and processes | Large: Complex analysis; Small: Quick guidance | Claude, GPT, Gemini, and more |

### How to Configure Agent Models

1. Navigate to **Settings** via the hamburger menu
2. **Expand individual agent cards** to view configuration options
3. **Click the current model** to open the model selection interface
4. **Use the Filter button** (funnel icon) to filter and sort available models:
   - **Filter by Type**: Include Free, Paid, and/or Multimodal models (OR logic)
   - **Sort Options**: Alphabetical (A-Z) or Date Added (Oldest First)
   - **Active Filter Indicator**: Badge shows number of active filters
5. **Select the optimal AI model** for each agent's specialized tasks
6. **Models are automatically saved** and persisted across sessions

### Advanced Filtering Features

**Inclusive Filtering:**
- **Free Models**: Shows all free models (including multimodal free models)
- **Paid Models**: Shows all paid models (including multimodal paid models)
- **Multimodal Models**: Shows all multimodal models (both free and paid)
- **Multiple Selections**: Selecting multiple filters expands results to include models matching any criteria (OR logic)

**Intelligent Sorting:**
- **Alphabetical (A-Z)**: Sort models by name for easy browsing
- **Date Added (Oldest First)**: Find established, reliable models

**Visual Indicators:**
- Clear badges show model types (Free, Paid, Multimodal)
- Active filter count displayed in badge
- Model capabilities shown with icons

**Mobile Optimization:**
- Larger touch-friendly icons and buttons
- Optimized layout for mobile devices

**Accessibility:**
- Full keyboard navigation support
- Screen reader compatible
- ARIA labels for all interactive elements

---

## Asking Questions

### Question Types

Select the appropriate question type for your query:

| Type | Purpose | Best For |
|------|---------|----------|
| **Documentation** | Get comprehensive guides | Learning new concepts, understanding features |
| **Recommendation** | Receive best practice advice | Implementation decisions, optimization strategies |
| **Script** | Generate code solutions | Creating business rules, client scripts, script includes |
| **Troubleshoot** | Debug and resolve issues | Error resolution, problem diagnosis |

### Question Workflow

1. **Select Question Type** from the dropdown menu
2. **Enter Your Question** in the text area
3. **Attach Files** (optional, if multimodal model is configured)
4. **Submit Query** using the "Get Help" button or press Enter
5. **Watch Live Responses** stream in real-time as the AI generates answers
6. **View AI-Generated Diagrams** rendered as interactive Mermaid flowcharts
7. **Export Answers** as Markdown or PDF using the Export button
8. **Deploy Scripts** directly to ServiceNow using the "Send to ServiceNow" button
9. **Access History** through the conversation panel with advanced filtering
10. **Save to Knowledge Store** by clicking the "Add to Knowledge Store" button

### Real-Time Streaming

The application provides ChatGPT-like live response generation:
- **Immediate Feedback**: See AI response chunks as they're generated
- **Automatic Scrolling**: Interface scrolls to responses when streaming starts
- **Cancel Anytime**: Stop generation with the stop button
- **Connection Status**: Visual indicators show connection health
- **Network Resilience**: Automatic retry on connection issues

---

## File Attachments (Multimodal Support)

Enhance your questions with file attachments when using multimodal AI models.

### Supported Features

| Feature | Description | Requirements |
|---------|-------------|--------------|
| **File Upload** | Attach images, documents, and other files | Multimodal model selected |
| **Supported Types** | Images (PNG, JPG, GIF), PDFs, text files | Model with image/text capabilities |
| **Audio Support** | Audio file analysis and transcription | Model with audio capabilities |
| **Visual Analysis** | AI can analyze screenshots, diagrams, error messages | Model with image capabilities |

### How to Enable Attachments

1. Navigate to **Settings** → **AI Models**
2. Define or select a model with multimodal capabilities:
   - ✅ **Text** - Basic text processing (always enabled)
   - ✅ **Image** - Visual content analysis
   - ✅ **Audio** - Audio file processing
3. The **attachment button** (📎) will appear automatically in the search interface
4. Click the attachment button to upload files

### Attachment Workflow

1. **Configure Multimodal Model** in settings
2. **Click Attachment Button** in search interface
3. **Select File** from your device
4. **Preview Attached File** before submission
5. **Submit Question** with attachment
6. **AI Analyzes Content** and provides context-aware response

### Best Practices

- **Screenshots**: Attach error messages or UI screenshots for troubleshooting
- **Diagrams**: Upload flowcharts or architecture diagrams for analysis
- **Code Files**: Attach script files for review and optimization
- **Documentation**: Upload PDFs or images of documentation for reference

> **Note:** File attachment functionality is only visible when a multimodal AI model is selected. Configure model capabilities in the settings menu to enable this feature.

---

## Script Deployment to ServiceNow

Deploy AI-generated scripts directly to your ServiceNow instance with seamless integration.

### Deployment Features

| Feature | Description | Script Types |
|---------|-------------|--------------|
| **One-Click Deployment** | Send scripts directly from code blocks | Business Rules, Script Includes, Client Scripts |
| **Type Selection Modal** | Choose the correct ServiceNow script type | Automated table targeting |
| **Real-time Feedback** | Instant success/failure notifications | User-friendly error messages |
| **Secure Integration** | Authentication-protected API endpoints | N8N workflow processing |

### How to Deploy Scripts

1. **Generate Scripts** by asking AI for ServiceNow code solutions
   - Example: "Create a business rule to update priority based on urgency"
2. **Identify Code Blocks** with syntax highlighting in AI responses
3. **Click Send Button** (📤) located next to Copy and Fullscreen buttons on code blocks
4. **Select Script Type** from the modal:
   - **Business Rule** → Deploys to `sys_script` table
   - **Script Include** → Deploys to `sys_script_include` table
   - **Client Script** → Deploys to `sys_script_client` table
5. **Confirm Deployment** and receive success confirmation with sys_id
6. **View in ServiceNow** - Scripts are created directly in your ServiceNow instance

### Supported Script Types

| Script Type | Target Table | Use Case |
|-------------|-------------|----------|
| **Business Rules** | `sys_script` | Server-side logic triggered by database operations |
| **Script Includes** | `sys_script_include` | Reusable server-side JavaScript libraries and APIs |
| **Client Scripts** | `sys_script_client` | Client-side validation and UI logic |

### Integration Benefits

- **Seamless Workflow**: No copy-paste needed between ServiceNow Helper and ServiceNow
- **Error Prevention**: Automated table targeting prevents deployment mistakes
- **Audit Trail**: All deployments tracked through ServiceNow's standard audit system
- **Security**: Authentication required and processed through secure N8N workflows
- **Time Savings**: Rapidly deploy generated scripts without manual setup

### Troubleshooting Deployment

**Common Issues:**
- **Authentication Failed**: Verify ServiceNow credentials in environment variables
- **Invalid Script Type**: Ensure correct script type selected for the code
- **Network Error**: Check ServiceNow instance connectivity
- **Permission Denied**: Verify user has rights to create scripts in ServiceNow

---

## Mermaid Diagram Support

AI-generated diagrams enhance code documentation and solution explanations.

### Diagram Features

| Feature | Description | Supported Types |
|---------|-------------|-----------------|
| **AI-Generated Diagrams** | Flowcharts, sequence diagrams, and more generated by AI | All Mermaid diagram types |
| **Streaming Support** | Diagrams render automatically when code is complete during streaming | Real-time rendering |
| **Read-Only Display** | Interactive diagrams with View Source toggle | No editing required |
| **Theme Support** | Diagrams adapt to light/dark mode automatically | Light & Dark themes |
| **Export Integration** | Diagrams preserved in Markdown and rendered as images in PDFs | Full export support |

### Supported Diagram Types

- **Flowcharts** - Process flows and decision trees
- **Sequence Diagrams** - Interaction sequences and message flows
- **Class Diagrams** - Object-oriented structures
- **State Diagrams** - State machines and transitions
- **ER Diagrams** - Entity relationships
- **Gantt Charts** - Project timelines
- **Pie Charts** - Data visualizations
- **And more** - Journey maps, mindmaps, timelines, Git graphs, C4 diagrams

### How to Use Mermaid Diagrams

1. **Ask AI** to include diagrams in responses
   - Example: "Explain the incident management process with a flowchart"
   - Example: "Create a sequence diagram for the user authentication flow"
2. **View Rendered Diagram** - AI generates Mermaid code, automatically rendered as SVG
3. **Toggle Source** - Click "View Source" button to see the Mermaid code
4. **Copy Code** - Use the Copy button to copy diagram source for use elsewhere
5. **Export** - Diagrams included as code in Markdown, rendered as images in PDF

### Example AI Requests

**Request Flowchart:**
> "Create a flowchart showing the ServiceNow incident management process"

**Request Sequence Diagram:**
> "Show a sequence diagram for how users authenticate in ServiceNow"

**Request ER Diagram:**
> "Diagram the entity relationships between Incident, User, and Assignment Group tables"

### Diagram Rendering

**Automatic Rendering:**
- Diagrams render automatically when Mermaid code block is complete
- Supports streaming - diagrams appear as AI generates them
- Fallback to code view if diagram syntax is invalid

**Theme Integration:**
- Diagrams automatically adapt to current theme (light/dark)
- Colors and styles optimized for readability in both modes

**Interactive Features:**
- View Source toggle to see/hide Mermaid code
- Copy button to copy diagram code
- Full-screen view for complex diagrams

---

## Answer Export Functionality

Save AI-generated answers for documentation, sharing, and offline reference.

### Export Features

| Feature | Description | Formats |
|---------|-------------|---------|
| **Multiple Formats** | Export answers as Markdown or styled PDF | .md, .pdf |
| **Question Inclusion** | Optionally include the original question | Toggle on/off (default: on) |
| **Mermaid Diagram Support** | Diagrams preserved as code (Markdown) or images (PDF) | Automatic conversion |
| **File System Access** | Native save dialog on supported browsers | Chrome, Edge, Opera |
| **Custom Filenames** | Edit filename before saving | Auto-generated with timestamp |
| **Styled PDFs** | PDF exports match UI styling | Headings, code blocks, lists, tables, diagrams |

### How to Export Answers

1. **Receive Answer** from AI in the response section
2. **Click Export Button** (📥) located in the response header
3. **Choose Format** - Select Markdown (.md) or PDF (.pdf) from the modal
4. **Edit Filename** - Customize the filename (default: `ServiceNow-Helper-YYYY-MM-DD-HH-MM-SS`)
5. **Include Question** - Toggle whether to include the original question (enabled by default)
6. **Save File** - Click Export to save:
   - **Chrome/Edge/Opera**: Native save dialog to choose destination
   - **Safari/Firefox**: Downloads to default Downloads folder

### Export Formats

**Markdown (.md):**
- Plain text format with formatting preserved
- Mermaid code blocks preserved for rendering in other tools
- Perfect for documentation systems (GitHub, GitLab, Confluence)
- Compatible with version control (Git)
- Can be edited in any text editor

**PDF (.pdf):**
- Professionally styled document matching UI appearance
- Mermaid diagrams rendered as high-quality images
- Syntax highlighting for code blocks
- Proper formatting for headings, lists, tables
- Ready for presentations and sharing

### Browser Support

**File System Access API** (Native Save Dialog):
- ✅ Chrome 86+
- ✅ Edge 86+
- ✅ Opera 72+

**Download Fallback** (All Browsers):
- ✅ Safari (all versions)
- ✅ Firefox (all versions)
- ✅ All modern browsers

**PWA Compatible:**
- Works in both web and Progressive Web App modes
- Offline export available for cached answers

### Export Benefits

**Documentation:**
- Create searchable documentation from AI responses
- Build knowledge bases with exported answers
- Generate user guides and training materials

**Knowledge Sharing:**
- Share formatted answers with team members
- Distribute solutions to common problems
- Collaborate on documentation projects

**Offline Reference:**
- Access important answers without internet connection
- Keep local copies of critical information
- Build personal knowledge library

**Version Control:**
- Track answer evolution with Markdown in Git repositories
- Compare different AI responses over time
- Maintain documentation history

**Professional Output:**
- PDF exports maintain visual styling for presentations
- Print-ready format for physical documentation
- Professional appearance for client-facing materials

---

## Knowledge Store Management

Efficiently manage your curated Q&A Knowledge Store with comprehensive management features.

### Management Features

| Feature | Description | Access |
|---------|-------------|--------|
| **Browse All Entries** | View complete list of saved Q&A pairs | Hamburger Menu → Knowledge Store |
| **Search & Filter** | Find entries by keywords in questions/answers | Search bar in management interface |
| **Bulk Operations** | Select and delete multiple entries simultaneously | Checkbox selection + bulk actions |
| **Quality Metrics** | View usage counts and quality scores | Displayed on each entry |
| **Metadata Display** | See creation dates, categories, and tags | Entry details view |
| **Individual Deletion** | Remove specific entries with confirmation | Delete button on each entry |

### How to Access Knowledge Store

1. **Click hamburger menu** (☰) in the top-left corner
2. **Select "Knowledge Store"** from the menu
3. **Browse all saved Q&A pairs** with metadata

### How to Add to Knowledge Store

1. **Receive helpful AI response** in the results section
2. **Click "Add to Knowledge Store"** button in response header
3. **Entry automatically saved** with question, answer, and metadata
4. **Confirmation message** displayed when saved successfully

### How to Manage Entries

**Browse Entries:**
- View all saved Q&A pairs in a scrollable list
- See metadata: creation date, category, quality score
- Preview questions and truncated answers

**Search Content:**
- Use search bar to find specific entries
- Searches both questions and answers
- Real-time filtering as you type

**View Details:**
- Click on any entry to expand full answer
- See complete metadata and quality metrics
- Review tags and categories

**Delete Entries:**
- **Individual deletion**: Click delete button on specific entry
- **Bulk deletion**:
  1. Select multiple entries using checkboxes
  2. Click "Delete Selected" button
  3. Confirm deletion in modal
- Confirmation required for safety

**Navigate Back:**
- Click close button (×) or back button to return to main interface

### Knowledge Store Benefits

**Automated Integration:**
- AI automatically uses knowledge store content for enhanced responses
- Relevant saved answers referenced in new responses
- Improves response quality over time

**Quality Tracking:**
- Monitor which entries are most valuable with usage metrics
- Identify high-quality answers for prioritization
- Remove outdated or low-quality entries

**Organized Content:**
- Categories and tags help organize information
- Search and filter for quick access
- Build structured knowledge base

**Bulk Management:**
- Efficiently manage large collections of saved Q&A pairs
- Select and delete multiple entries at once
- Maintain clean, relevant knowledge store

### Best Practices

**What to Save:**
- ✅ Accurate, well-explained answers
- ✅ Complete code solutions that work
- ✅ Detailed troubleshooting procedures
- ✅ Complex explanations you might need again

**What to Avoid:**
- ❌ Incorrect or outdated information
- ❌ Incomplete answers
- ❌ Duplicate entries
- ❌ Overly specific one-time questions

**Maintenance:**
- Regularly review and clean up entries
- Remove outdated information
- Update entries when better solutions are found
- Use bulk operations for efficiency

---

## Tips & Best Practices

### Asking Effective Questions

**Be Specific:**
- Include relevant details (table names, field names, error messages)
- Specify ServiceNow version if applicable
- Mention any constraints or requirements

**Provide Context:**
- Explain what you're trying to achieve
- Mention any attempted solutions
- Include relevant background information

**Attach Files:**
- Use multimodal support for screenshots
- Include error messages as images
- Attach existing code for review

### Optimizing AI Responses

**Choose the Right Agent & Complexity Level:**
- Use **Planner Agent** for strategy, requirements analysis, and solution design
- Use **Coder Agent** for script generation, code snippets, and implementations
- Use **Architect Agent** for system design, data models, and technical frameworks
- Use **Process SME Agent** for ServiceNow workflows and business process questions
- Select **Large variant** for complex tasks requiring deep analysis
- Select **Small variant** for well-defined, straightforward tasks
- Let **Orchestration Agent** coordinate and route between specialized agents

**Select Appropriate Models:**
- Use cost-effective models (small variants) for simple, well-defined questions
- Reserve premium models (large variants) for complex tasks requiring deeper reasoning
- Configure different models per agent for optimization
- Match model capability to task complexity for best performance/cost ratio

**Iterative Refinement:**
- Ask follow-up questions to clarify
- Request modifications to generated code
- Build on previous responses for better context

### Managing Your Workflow

**Organization:**
- Use descriptive filenames when exporting
- Save important answers to knowledge store
- Organize exports in project folders

**Efficiency:**
- Configure default settings for common workflows
- Use keyboard shortcuts where available
- Deploy scripts directly instead of copying manually

**Collaboration:**
- Export answers in PDF for sharing with team
- Use Markdown format for documentation repositories
- Share knowledge store entries with colleagues

---

## Troubleshooting

### Common Issues

**Streaming Not Working:**
- Check network connectivity
- Verify ServiceNow Helper is running (port 3000)
- Check n8n service status (port 5678)
- Review browser console for errors

**Authentication Failed:**
- Verify credentials are correct
- Check JWT_SECRET environment variable
- Clear browser cookies and try again

**File Attachments Not Visible:**
- Ensure multimodal model is configured
- Check model has image/audio capabilities enabled
- Verify settings were saved successfully

**Script Deployment Failed:**
- Verify ServiceNow credentials in environment variables
- Check ServiceNow instance connectivity
- Ensure user has permission to create scripts
- Review N8N workflow logs

**Export Not Working:**
- Check browser supports File System Access API
- Try different export format (PDF vs Markdown)
- Ensure answer has completed generating
- Check browser console for errors

### Getting Help

**In-App Resources:**
- Access User Manual from hamburger menu
- Review settings descriptions and tooltips
- Check connection status indicators

**External Resources:**
- Review documentation in `docs/` folder
- Check GitHub issues for known problems
- Contact support with detailed error messages

---

## Next Steps

- [Architecture Documentation](./ARCHITECTURE.md) - Understand system design
- [Database Configuration](./DATABASE.md) - Set up providers and agents
- [Development Guide](./DEVELOPMENT.md) - Contribute to the project
- [UI Design System](./UI_DESIGN.md) - Learn about interface design
- [Testing Guide](./TESTING.md) - Run and write tests
