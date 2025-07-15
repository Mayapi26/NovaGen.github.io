import React, { useState, useEffect, useRef } from 'react';

// Lucide React Icons
import {
  Lightbulb, Users, Award, MessageSquare, Folder, Kanban, User, Briefcase,
  Calendar, ChevronRight, X, Sparkles, TrendingUp, Cpu, Palette, Settings,
  CheckCircle, AlertCircle, Info, Send, Plus, Trash2, Edit, Save, Loader2, File,
  Building2, BookOpen, Star, Newspaper, ArrowLeft, ArrowRight // Added for new sections and carousel
} from 'lucide-react';

// Utility for unique IDs (now purely local)
const generateUniqueId = () => crypto.randomUUID();

function App() {
  // State management for navigation and UI elements
  const [currentView, setCurrentView] = useState('landing');
  const [showModal, setShowModal] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState('info');
  const [showNotification, setShowNotification] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // User and Team Data States (now local only)
  const [userData, setUserData] = useState(null); // Stores user's submitted form data
  const [teamData, setTeamData] = useState(null); // Stores assigned team and mentor
  const [teamMessages, setTeamMessages] = useState([]); // Chat messages for the team
  const [teamTasks, setTeamTasks] = useState([]); // Kanban board tasks for the team

  // Local user ID (no longer from Firebase Auth)
  const [localUserId, setLocalUserId] = useState(generateUniqueId());

  // Refs for auto-scrolling chat
  const messagesEndRef = useRef(null);

  // Scroll to bottom of messages when new message arrives
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [teamMessages]);

  // --- Notification Handler ---
  const setNotification = (type, message) => {
    setNotificationType(type);
    setNotificationMessage(message);
    setShowNotification(true);
    const timer = setTimeout(() => {
      setShowNotification(false);
      setNotificationMessage('');
    }, 5000); // Notification disappears after 5 seconds
    return () => clearTimeout(timer);
  };

  // --- Local Data Operations (no Firebase) ---
  const saveUserData = async (formData) => {
    setIsLoading(true);

    const mentor = assignMentor(formData.age, formData.techTrends);
    const teamMembers = generateTeamMembers(formData.name, localUserId); // Pass localUserId

    const dataToSave = {
      ...formData,
      userId: localUserId, // Use the locally generated ID
      teamId: generateUniqueId(), // Generate a local team ID
      mentor: mentor.name,
      mentorDescription: mentor.description,
      teamMembers: teamMembers,
      createdAt: new Date(), // Use local date for timestamp
    };

    setUserData(dataToSave);
    setTeamData({ teamId: dataToSave.teamId, mentor: mentor.name, mentorDescription: mentor.description, members: teamMembers });
    setNotification('success', 'Session started and team assigned!');
    setShowModal(false);
    setCurrentView('hackWeek'); // Navigate to hack week after submission
    setIsLoading(false);
  };

  const addChatMessage = (messageContent) => {
    if (!teamData?.teamId || !localUserId || !messageContent.trim()) {
      setNotification('error', 'Cannot send empty message or missing team/user info.');
      return;
    }

    const newMessage = {
      id: generateUniqueId(), // Local ID for message
      senderId: localUserId,
      senderName: userData?.name || 'Anonymous',
      message: messageContent,
      timestamp: new Date(), // Local timestamp
    };
    setTeamMessages(prevMessages => [...prevMessages, newMessage]);
  };

  const addTask = (taskTitle, taskDescription) => {
    if (!teamData?.teamId || !taskTitle.trim()) {
      setNotification('error', 'Task title cannot be empty.');
      return;
    }

    const newTask = {
      id: generateUniqueId(), // Local ID for task
      title: taskTitle,
      description: taskDescription,
      status: 'todo', // Default status
      createdAt: new Date(),
      createdBy: localUserId,
      assignedTo: userData?.name || 'Unassigned',
    };
    setTeamTasks(prevTasks => [...prevTasks, newTask]);
    setNotification('success', 'Task added successfully!');
  };

  const updateTaskStatus = (taskId, newStatus) => {
    setTeamTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, status: newStatus } : task
      )
    );
    setNotification('success', 'Task updated!');
  };

  const deleteTask = (taskId) => {
    setTeamTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    setNotification('success', 'Task deleted!');
  };

  // --- AI Mentor and Team Generation Logic ---
  const assignMentor = (age, techTrends) => {
    const mentors = [
      { name: "Ada Lovelace", era: "Early Computing", focus: ["algorithms", "mathematics"],
        description: "Pioneer of computer programming, known for her work on Charles Babbage's Analytical Engine." },
      { name: "Alan Turing", era: "WWII & AI Foundations", focus: ["AI", "cryptography", "logic"],
        description: "Mathematician and computer scientist, considered the father of artificial intelligence and theoretical computer science." },
      { name: "Grace Hopper", era: "Early Software", focus: ["programming languages", "compilers"],
        description: "Admiral and computer scientist, pioneer in programming languages and the first to use the term 'bug'." },
      { name: "Steve Jobs", era: "Personal Computing", focus: ["UX", "design", "innovation"],
        description: "Co-founder of Apple, visionary in design and user experience, revolutionized the tech industry." },
      { name: "Bill Gates", era: "Software Empires", focus: ["software development", "scalability"],
        description: "Co-founder of Microsoft, a key figure in the software revolution and personal computing." },
      { name: "Linus Torvalds", era: "Open Source", focus: ["operating systems", "kernel development"],
        description: "Creator of the Linux kernel, an influential figure in open-source software development." },
    ];

    // Simple AI logic: choose a mentor based on keywords in tech trends
    const lowerCaseTrends = techTrends.map(t => t.toLowerCase());
    for (const mentor of mentors) {
      if (mentor.focus.some(f => lowerCaseTrends.includes(f.toLowerCase()))) {
        return mentor;
      }
    }
    // If no specific match, fall back to a random one
    return mentors[Math.floor(Math.random() * mentors.length)];
  };

  const generateTeamMembers = (userName, currentLocalUserId) => {
    const inventedNames = ["Alex Chen", "Priya Sharma", "Omar Rodriguez", "Sarah Kim"];
    // Ensure the submitting user is part of the team and is the first member
    const members = [{ name: userName, userId: currentLocalUserId, isUser: true }];
    // Add other invented members
    inventedNames.forEach(name => {
      // Avoid duplicate names if the user's name is one of the invented ones
      if (name !== userName) {
        members.push({ name: name });
      }
    });
    // Ensure exactly 5 members (1 user + 4 invented, or fewer if user's name overlaps)
    while (members.length < 5 && inventedNames.length > 0) {
      const newName = inventedNames.pop();
      if (!members.some(m => m.name === newName)) {
        members.push({ name: newName });
      }
    }
    return members.slice(0, 5); // Ensure a maximum of 5 members
  };

  // --- Components for different sections ---

  const Notification = ({ message, type, onClose }) => {
    const bgColorClass = {
      success: 'notification-success',
      error: 'notification-error',
      info: 'notification-info',
    }[type];
    const Icon = {
      success: CheckCircle,
      error: AlertCircle,
      info: Info,
    }[type];

    return (
      <div className={`notification ${bgColorClass}`}>
        <Icon className="icon" />
        <span>{message}</span>
        <button onClick={onClose} className="close-btn">
          <X className="icon" />
        </button>
      </div>
    );
  };

  const LandingPage = ({ onStartSession }) => (
    <div className="landing-page-container">
      {/* Header stripe with image and main title/slogan */}
      <div className="header-hero">
        <h1 className="main-title">NovaGen</h1>
        <p className="subtitle">Mentoring innovation across generations.</p>
      </div>

      <div className="landing-content">
        {/* Section 1: Image Left, Text Right */}
        <div className="content-section image-left-text-right animate-fade-in">
          <div className="image-container">
            <img src="https://images.unsplash.com/photo-1480944657103-7fed22359e1d?q=80&w=2064&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="Collaborative Team" className="section-image" />
          </div>
          <div className="text-container">
            <h3 className="section-title">What is NovaGen?</h3>
            <p className="section-description">
              A structured platform-based program where Gen Z team members anonymously submit new tools, frameworks, or platform upgrade ideas, and Gen X (and senior members) evaluate their feasibility. The most promising ideas are then developed in cross-generational hack weeks, where mixed teams prototype, test, and reflect together, each assigned to an AI-powered mentor based on famous tech figures.
            </p>
          </div>
        </div>

        {/* Section 2: Text Left, Image Right */}
        <div className="content-section text-left-image-right animate-fade-in">
          <div className="text-container">
            <h3 className="section-title">Why it Works</h3>
            <ul className="list-styled section-description">
              <li>Gives Gen Z a voice without fear of judgment.</li>
              <li>Lets Gen X apply their deep knowledge of feasibility and systems.</li>
              <li>Builds shared learning and co-ownership across generations.</li>
              <li>Transforms siloed ideas into team-based innovation.</li>
            </ul>
          </div>
          <div className="image-container">
            <img src="https://images.unsplash.com/photo-1617791160536-598cf32026fb?q=80&w=1528&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="Innovation Process" className="section-image" />
          </div>
        </div>

        {/* Testimonials */}
        <div className="testimonials-section animate-fade-in">
          <h2 className="testimonials-title">What Our Clients Say</h2>
          <div className="grid-layout-3-cols">
            <div className="section-card testimonial-card">
              <p className="testimonial-text">"The Innovation Loop Weeks transformed our internal culture. Ideas flow freely, and implementation is faster than ever!"</p>
              <p className="testimonial-author">- Maria G., CTO at InnovateX</p>
            </div>
            <div className="section-card testimonial-card">
              <p className="testimonial-text">"Our younger talent feels truly heard, and our senior engineers are energized by the fresh perspectives. A win-win!"</p>
              <p className="testimonial-author">- David L., HR Director at FutureTech Solutions</p>
            </div>
            <div className="section-card testimonial-card">
              <p className="testimonial-text">"The cross-generational hack weeks are brilliant. We've seen real, tangible prototypes emerge in record time."</p>
              <p className="testimonial-author">- Sofia R., CEO of Global Systems Inc.</p>
            </div>
          </div>
        </div>

        <button
          onClick={onStartSession}
          className="main-button animate-fade-in"
        >
          Start Innovation Journey
        </button>
      </div>
    </div>
  );

  const AboutPage = () => (
    <div className="about-page-container animate-fade-in">
      <div className="about-content">
        <div className="about-logo-section">
          {/* Placeholder for company logo */}
          {/* To use your own logo, place your image file (e.g., 'my-logo.png') in the 'public' folder
              of your project. Then, update the 'src' attribute below to '/my-logo.png'. */}
          <img src="/Captura de pantalla 2025-07-14 133945.png" alt="Company Logo" className="company-logo" />
          <h2 className="about-title">About <strong className="about-accent-text-black">Out of the Box</strong></h2>
        </div>
        <p className="about-text">
          At <strong className="about-accent-text-black">Out of the Box</strong>, we are a leading technology innovation company,
          committed to developing cutting-edge solutions that drive progress in Mexico.
          Our mission transcends the mere creation of technology; we are dedicated to building bridges
          between generations of talent, fostering an ecosystem where experience and new ideas
          converge to solve the most pressing challenges of our society.
        </p>
        <p className="about-text">
          We firmly believe in the power of intergenerational collaboration. Our philosophy focuses
          on empowering young minds with the wisdom of veterans, and revitalizing experience
          with the freshness of new perspectives. Through structured programs such as
          "Innovation Loop Weeks", we transform ideas into tangible innovations,
          ensuring a vibrant technological future and lasting positive impact in Mexico.
        </p>
        <p className="about-text">
          Our team is composed of visionaries, engineers, designers, and strategists who share
          an unwavering passion for innovation and a deep commitment to the well-being of our nation.
          We are proud to be a catalyst for change, driving creativity and excellence in every project.
        </p>
      </div>
    </div>
  );


  const StartSessionModal = ({ onSubmit, onClose, setNotification }) => {
    const [name, setName] = useState('');
    const [company, setCompany] = useState('');
    const [workstation, setWorkstation] = useState('');
    const [age, setAge] = useState('');
    const [techTrends, setTechTrends] = useState([]);
    const [implementationPreferences, setImplementationPreferences] = useState(''); // For Gen Z
    const [projectFeasibilityResponses, setProjectFeasibilityResponses] = useState({}); // For older generations
    const [projectsToEvaluate, setProjectsToEvaluate] = useState([]); // Dynamically selected projects

    const techTrendOptions = [
      "AI Tools (LLMs, ML Ops)", "New APIs (Web3, IoT)", "Design Systems and UI/UX",
      "Cloud-Native and Serverless", "Cybersecurity and Privacy", "Quantum Computing",
      "Sustainable Technology", "DevOps and Automation", "AR/VR and Metaverse"
    ];

    // Comprehensive list of projects with associated trends
    const allPossibleProjects = [
      { id: 'proj_ai_1', name: "AI-powered Customer Support Chatbot with LLM Integration", trend: "AI Tools (LLMs, ML Ops)", description: "Develop a chatbot capable of handling complex customer queries using large language models and machine learning operations." },
      { id: 'proj_ai_2', name: "Automated ML Model Deployment Pipeline (MLOps)", trend: "AI Tools (LLMs, ML Ops)", description: "Implement a CI/CD pipeline specifically for machine learning models, ensuring seamless deployment and monitoring." },
      { id: 'proj_api_1', name: "Decentralized Identity Management System (Web3)", trend: "New APIs (Web3, IoT)", description: "Create a secure identity system leveraging blockchain technology for enhanced privacy and user control." },
      { id: 'proj_api_2', name: "Smart City IoT Sensor Data Platform", trend: "New APIs (Web3, IoT)", description: "Build a platform to collect, process, and visualize data from IoT sensors for urban planning and resource management." },
      { id: 'proj_design_1', name: "Company-wide Design System Implementation", trend: "Design Systems and UI/UX", description: "Establish a comprehensive design system with reusable components and guidelines to ensure consistent UI/UX across all products." },
      { id: 'proj_design_2', name: "User-Centric Mobile App Redesign", trend: "Design Systems and UI/UX", description: "Redesign an existing mobile application focusing on improving user experience and interface aesthetics based on modern UI/UX principles." },
      { id: 'proj_cloud_1', name: "Migration to Serverless Architecture on GCP/AWS", trend: "Cloud-Native and Serverless", description: "Migrate existing monolithic applications to a serverless architecture, leveraging cloud functions and managed services for scalability and cost efficiency." },
      { id: 'proj_cloud_2', name: "Kubernetes-based Microservices Deployment", trend: "Cloud-Native and Serverless", description: "Implement a container orchestration system using Kubernetes for deploying and managing microservices in a cloud-native environment." },
      { id: 'proj_cyber_1', name: "Enhanced Cybersecurity Data Encryption Protocol", trend: "Cybersecurity and Privacy", description: "Develop and integrate a new, more robust data encryption protocol for sensitive customer information." },
      { id: 'proj_cyber_2', name: "Real-time Threat Detection System", trend: "Cybersecurity and Privacy", description: "Build a system that uses AI and machine learning to detect and respond to cybersecurity threats in real-time." },
      { id: 'proj_quantum_1', name: "Quantum-Resistant Cryptography Research Project", trend: "Quantum Computing", description: "Research and prototype cryptographic algorithms that are resistant to attacks from future quantum computers." },
      { id: 'proj_quantum_2', name: "Quantum Machine Learning Algorithm Development", trend: "Quantum Computing", description: "Explore and develop machine learning algorithms designed to run on quantum computers for specific computational advantages." },
      { id: 'proj_sustain_1', name: "Energy Consumption Optimization Software for Data Centers", trend: "Sustainable Technology", description: "Develop software to monitor and optimize energy usage in data centers, reducing environmental impact and operational costs." },
      { id: 'proj_sustain_2', name: "Blockchain for Supply Chain Traceability (Sustainability Focus)", trend: "Sustainable Technology", description: "Implement a blockchain solution to enhance transparency and traceability in supply chains, verifying sustainable practices." },
      { id: 'proj_devops_1', name: "Automated CI/CD Pipeline for Multi-Cloud Deployments", trend: "DevOps and Automation", description: "Design and implement an automated Continuous Integration/Continuous Delivery pipeline that supports deployments across multiple cloud providers." },
      { id: 'proj_devops_2', name: "Infrastructure as Code (IaC) Adoption for Cloud Resources", trend: "DevOps and Automation", description: "Transition infrastructure management to Infrastructure as Code (IaC) using tools like Terraform or Ansible for consistent and repeatable deployments." },
      { id: 'proj_arvr_1', name: "AR/VR Remote Collaboration Tool for Engineering Teams", trend: "AR/VR and Metaverse", description: "Develop an augmented/virtual reality application to facilitate remote collaboration for geographically dispersed engineering teams, enabling shared 3D model interaction." },
      { id: 'proj_arvr_2', name: "Metaverse Platform for Virtual Product Showcases", trend: "AR/VR and Metaverse", description: "Build a virtual metaverse environment where customers can explore and interact with digital twins of products." },
    ];

    // Effect to dynamically select projects based on techTrends
    useEffect(() => {
      if (['25-40', '40-55', '55+'].includes(age) && techTrends.length > 0) {
        // Filter projects to only include those whose trend is among the selected techTrends
        const filteredProjects = allPossibleProjects.filter(proj =>
          techTrends.includes(proj.trend)
        );
        setProjectsToEvaluate(filteredProjects);

        // Initialize responses for the newly selected projects
        const initialResponses = {};
        filteredProjects.forEach(proj => {
          initialResponses[proj.id] = { feasibility: '', viability: '', challenge: '' };
        });
        setProjectFeasibilityResponses(initialResponses);

      } else {
        setProjectsToEvaluate([]);
        setProjectFeasibilityResponses({}); // Clear if not an older group or no trends selected
      }
    }, [age, techTrends]);


    const handleTrendChange = (e) => {
      const { value, checked } = e.target;
      setTechTrends(prev =>
        checked ? [...prev, value] : prev.filter(trend => trend !== value)
      );
    };

    const handleProjectResponseChange = (projectId, field, value) => {
      setProjectFeasibilityResponses(prev => ({
        ...prev,
        [projectId]: {
          ...prev[projectId],
          [field]: value
        }
      }));
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      if (!name || !company || !workstation || !age || techTrends.length === 0) {
        setNotification('error', 'Please fill in all required fields.');
        return;
      }

      let submissionData = { name, company, workstation, age, techTrends };

      if (age === 'Under 25') {
        submissionData = { ...submissionData, implementationPreferences };
      } else {
        // For older generations, include the evaluated projects and their responses
        submissionData = { ...submissionData, evaluatedProjects: projectsToEvaluate.map(p => ({
            id: p.id,
            name: p.name,
            trend: p.trend,
            responses: projectFeasibilityResponses[p.id]
        }))};
      }

      onSubmit(submissionData);
    };

    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <button onClick={onClose} className="modal-close-btn">
            <X className="icon" />
          </button>
          <h2 className="modal-title">Start Your Innovation Journey</h2>

          <form onSubmit={handleSubmit} className="modal-form">
            {/* Registration Form - Part 1 */}
            <div className="form-group">
              <label htmlFor="name" className="form-label">Your Name</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="form-input"
                placeholder="John Doe"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="company" className="form-label">Company</label>
              <input
                type="text"
                id="company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="form-input"
                placeholder="Acme Corp"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="workstation" className="form-label">Position/Role</label>
              <input
                type="text"
                id="workstation"
                value={workstation}
                onChange={(e) => setWorkstation(e.target.value)}
                className="form-input"
                placeholder="Software Engineer"
                required
              />
            </div>

            {/* Questionnaire - Part 1 */}
            <div className="form-group">
              <label htmlFor="age" className="form-label">Your Age Group</label>
              <select
                id="age"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="form-input"
                required
              >
                <option value="">Select your age group</option>
                <option value="Under 25">Under 25 (Gen Z)</option>
                <option value="25-40">25-40 (Millennial)</option>
                <option value="40-55">40-55 (Gen X)</option>
                <option value="55+">Over 55 (Boomer/Senior)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">What tech trends are you interested in?</label>
              <div className="checkbox-grid">
                {techTrendOptions.map(trend => (
                  <label key={trend} className="checkbox-label">
                    <input
                      type="checkbox"
                      value={trend}
                      checked={techTrends.includes(trend)}
                      onChange={handleTrendChange}
                      className="form-checkbox"
                    />
                    <span className="checkbox-text">{trend}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Conditional Questions - Part 2 */}
            {age === 'Under 25' && (
              <div className="form-group animate-fade-in">
                <label htmlFor="implementation" className="form-label">What kind of implementations would you like to add?</label>
                <textarea
                  id="implementation"
                  value={implementationPreferences}
                  onChange={(e) => setImplementationPreferences(e.target.value)}
                  rows="4"
                  className="form-textarea"
                  placeholder="E.g.: a new AI-powered analytics dashboard, improved CI/CD pipelines, a scalable microservices architecture."
                ></textarea>
              </div>
            )}

            {['25-40', '40-55', '55+'].includes(age) && projectsToEvaluate.length > 0 && (
              <div className="form-group animate-fade-in">
                <label className="form-label">Evaluate the following project ideas:</label>
                {projectsToEvaluate.map(proj => (
                  <div key={proj.id} className="project-evaluation-card">
                    <h5 className="project-evaluation-title">{proj.name} ({proj.trend})</h5>
                    <div className="form-group">
                      <label htmlFor={`${proj.id}-feasibility`} className="form-label-small">How feasible do you consider its implementation?</label>
                      <textarea
                        id={`${proj.id}-feasibility`}
                        value={projectFeasibilityResponses[proj.id]?.feasibility || ''}
                        onChange={(e) => handleProjectResponseChange(proj.id, 'feasibility', e.target.value)}
                        rows="2"
                        className="form-textarea"
                        placeholder="e.g., Highly feasible, with moderate challenges in integration."
                      ></textarea>
                    </div>
                    <div className="form-group">
                      <label htmlFor={`${proj.id}-viability`} className="form-label-small">How viable do you see it in the long term?</label>
                      <textarea
                        id={`${proj.id}-viability`}
                        value={projectFeasibilityResponses[proj.id]?.viability || ''}
                        onChange={(e) => handleProjectResponseChange(proj.id, 'viability', e.target.value)}
                        rows="2"
                        className="form-textarea"
                        placeholder="e.g., Very viable, could bring significant ROI over 3-5 years."
                      ></textarea>
                    </div>
                    <div className="form-group">
                      <label htmlFor={`${proj.id}-challenge`} className="form-label-small">What would be the biggest challenge for its implementation?</label>
                      <textarea
                        id={`${proj.id}-challenge`}
                        value={projectFeasibilityResponses[proj.id]?.challenge || ''}
                        onChange={(e) => handleProjectResponseChange(proj.id, 'challenge', e.target.value)}
                        rows="2"
                        className="form-textarea"
                        placeholder="e.g., Securing specialized talent for quantum algorithms."
                      ></textarea>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              type="submit"
              className="submit-button"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="icon-spin" /> Submitting...
                </>
              ) : (
                <>
                  Submit <ChevronRight className="icon-inline" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  };

  const HackWeekSection = ({ onMeetMyTeam }) => (
    <div className="hack-week-container animate-fade-in">
      <div className="hack-week-content">
        <h2 className="hack-week-title">
          <Award className="icon-large" /> Hack Week of the Month
        </h2>
        <p className="hack-week-subtitle">
          Dive into innovation with our monthly challenge!
        </p>

        <div className="section-card hack-challenge-card">
          <h3 className="card-sub-title"><Lightbulb className="icon-inline" /> The Challenge: "Smart City Traffic Optimization"</h3>
          <p className="card-text">
            Develop an AI-powered solution to optimize urban traffic flow in Mexico City, reducing
            congestion and pollution. Ideas could include predictive traffic models, dynamic signal management,
            or intelligent routing applications.
          </p>
          <p className="card-text-bold"><Calendar className="icon-inline" /> Duration: From September 11 to 16 2025</p>
          <p className="card-text-bold"><Award className="icon-inline" /> Prize: An all-inclusive 4-day vacation in Tulum for the winning team!</p>
        </div>

        <button
          onClick={onMeetMyTeam}
          className="main-button"
        >
          Meet Your Team
        </button>
      </div>
    </div>
  );

  const TeamSection = () => {
    const [chatMessage, setChatMessage] = useState('');
    const [kanbanTaskTitle, setKanbanTaskTitle] = useState('');
    const [kanbanTaskDescription, setKanbanTaskDescription] = useState('');
    const [editingTaskId, setEditingTaskId] = useState(null);
    const [editedTaskTitle, setEditedTaskTitle] = useState('');
    const [editedTaskDescription, setEditedTaskDescription] = useState('');
    const [showMentorTooltip, setShowMentorTooltip] = useState(false); // New state for mentor tooltip

    // Default team data if no user data is present
    const defaultTeamData = {
      teamId: 'default-team',
      mentor: assignMentor(null, ["AI", "UX"]), // Assign a random mentor object
      members: [
        { name: 'Andrea Garcia' },
        { name: 'Carlos Lopez' },
        { name: 'Sofia Martinez' },
        { name: 'Ricardo Sanchez' },
      ],
    };

    // Use userData if available, otherwise use defaultTeamData
    const currentTeam = teamData || defaultTeamData;
    const currentUserId = userData?.userId || localUserId; // Use the actual userId for chat/task ownership

    const handleSendMessage = (e) => {
      e.preventDefault();
      addChatMessage(chatMessage);
      setChatMessage('');
    };

    const handleAddTask = (e) => {
      e.preventDefault();
      addTask(kanbanTaskTitle, kanbanTaskDescription);
      setKanbanTaskTitle('');
      setKanbanTaskDescription('');
    };

    const startEditingTask = (task) => {
      setEditingTaskId(task.id);
      setEditedTaskTitle(task.title);
      setEditedTaskDescription(task.description);
    };

    const saveEditedTask = (taskId) => {
      setTeamTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId ? { ...task, title: editedTaskTitle, description: editedTaskDescription } : task
        )
      );
      setNotification('success', 'Task updated!');
      setEditingTaskId(null);
    };

    // Placeholder for file sharing - just displays names
    const [sharedFiles, setSharedFiles] = useState([
      "Project_Brief_Q3.pdf",
      "Design_System_V2.sketch",
      "AI_Research_Paper.docx",
      "Traffic_Sim_Prototype.zip"
    ]);
    const [newFileName, setNewFileName] = useState('');

    const handleAddFile = () => {
      if (newFileName.trim()) {
        setSharedFiles(prev => [...prev, newFileName.trim()]);
        setNewFileName('');
        setNotification('success', 'File added to list!');
      } else {
        setNotification('error', 'File name cannot be empty.');
      }
    };

    // Filter tasks for Kanban columns
    const tasksTodo = teamTasks.filter(task => task.status === 'todo');
    const tasksInProgress = teamTasks.filter(task => task.status === 'in-progress');
    const tasksDone = teamTasks.filter(task => task.status === 'done');

    return (
      <div className="team-section-container animate-fade-in">
        <div className="team-section-content">
          <h2 className="team-section-title">
            <Users className="icon-large" /> Meet Your Team
          </h2>

          {/* User ID Display (now local) */}
          <div className="user-id-display">
            Your User ID: <span className="user-id-value">{currentUserId}</span>
            <p className="user-id-hint">This ID is unique to your local session.</p>
          </div>

          {/* Team Members */}
          <div className="team-members-section">
            <h3 className="section-sub-title"><Users className="icon-inline" /> Team Members</h3>
            <div className="team-members-grid">
              {currentTeam.members.map((member, index) => (
                <div key={index} className="member-card">
                  <User className="member-icon" />
                  <p className="member-name">{member.name} {member.isUser && "(You)"}</p>
                  <p className="member-role">{member.isUser ? (userData?.workstation || 'User') : "Developer"}</p>
                </div>
              ))}
            </div>
          </div>

          {/* AI Mentor */}
          <div className="ai-mentor-section">
            <h3 className="section-sub-title"><Cpu className="icon-inline" /> Your AI Mentor</h3>
            <div
              className="mentor-card-wrapper"
              onMouseEnter={() => setShowMentorTooltip(true)}
              onMouseLeave={() => setShowMentorTooltip(false)}
            >
              <div className="mentor-card">
                {/* Mentor image removed. Only text displayed. */}
                <Sparkles className="mentor-icon" /> {/* AI Icon */}
                <p className="mentor-name">{currentTeam.mentor}</p>
                <p className="mentor-description">
                  Your AI mentor, {currentTeam.mentor}, will guide your team with insights from their
                  era of technological innovation.
                </p>
              </div>
              {showMentorTooltip && (
                <div className="mentor-tooltip">
                  {currentTeam.mentorDescription || "This is your AI mentor. Hover for more details."}
                </div>
              )}
            </div>
          </div>

          {/* Collaboration Tools */}
          <div className="collaboration-tools-grid">
            {/* Team Chat */}
            <div className="team-chat-card">
              <h3 className="section-sub-title"><MessageSquare className="icon-inline" /> Team Chat</h3>
              <div className="chat-messages-container custom-scrollbar">
                {teamMessages.length === 0 ? (
                  <p className="chat-empty-message">No messages yet. Start the conversation!</p>
                ) : (
                  teamMessages.map((msg) => (
                    <div key={msg.id} className={`chat-message ${msg.senderId === currentUserId ? 'my-message' : 'other-message'}`}>
                      <p className="message-sender">{msg.senderName}</p>
                      <p className="message-content">{msg.message}</p>
                      <p className="message-timestamp">
                        {msg.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} /> {/* Scroll target */}
              </div>
              <form onSubmit={handleSendMessage} className="chat-input-form">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="chat-input"
                />
                <button
                  type="submit"
                  className="chat-send-button"
                >
                  <Send className="icon" />
                </button>
              </form>
            </div>

            {/* File Sharing */}
            <div className="file-sharing-card">
              <h3 className="section-sub-title"><Folder className="icon-inline" /> Shared Files</h3>
              <div className="file-list-container custom-scrollbar">
                {sharedFiles.length === 0 ? (
                  <p className="file-empty-message">No files shared yet.</p>
                ) : (
                  <ul className="file-list">
                    {sharedFiles.map((file, index) => (
                      <li key={index} className="file-item">
                        <File className="icon-small" /> {file}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="file-input-group">
                <input
                  type="text"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="Add file name (e.g., doc.pdf)"
                  className="file-input"
                />
                <button
                  onClick={handleAddFile}
                  className="file-add-button"
                >
                  <Plus className="icon" />
                </button>
              </div>
            </div>
          </div>

          {/* Kanban Board */}
          <div className="kanban-board-section">
            <h3 className="section-sub-title"><Kanban className="icon-inline" /> Project Board</h3>

            {/* Form to Add Task */}
            <div className="add-task-form-card">
              <h4 className="add-task-title">Add New Task</h4>
              <form onSubmit={handleAddTask} className="add-task-form">
                <input
                  type="text"
                  value={kanbanTaskTitle}
                  onChange={(e) => setKanbanTaskTitle(e.target.value)}
                  placeholder="Task Title"
                  className="form-input"
                  required
                />
                <textarea
                  value={kanbanTaskDescription}
                  onChange={(e) => setKanbanTaskDescription(e.target.value)}
                  placeholder="Task Description (optional)"
                  rows="2"
                  className="form-textarea"
                ></textarea>
                <button
                  type="submit"
                  className="add-task-button"
                >
                  <Plus className="icon-inline" /> Add Task
                </button>
              </form>
            </div>

            <div className="kanban-columns-grid">
              {/* To Do Column */}
              <KanbanColumn title="To Do" tasks={tasksTodo} status="todo"
                updateTaskStatus={updateTaskStatus} deleteTask={deleteTask}
                startEditingTask={startEditingTask} editingTaskId={editingTaskId}
                editedTaskTitle={editedTaskTitle} setEditedTaskTitle={setEditedTaskTitle}
                editedTaskDescription={editedTaskDescription} setEditedTaskDescription={setEditedTaskDescription}
                saveEditedTask={saveEditedTask}
              />
              {/* In Progress Column */}
              <KanbanColumn title="In Progress" tasks={tasksInProgress} status="in-progress"
                updateTaskStatus={updateTaskStatus} deleteTask={deleteTask}
                startEditingTask={startEditingTask} editingTaskId={editingTaskId}
                editedTaskTitle={editedTaskTitle} setEditedTaskTitle={setEditedTaskTitle}
                editedTaskDescription={editedTaskDescription} setEditedTaskDescription={setEditedTaskDescription}
                saveEditedTask={saveEditedTask}
              />
              {/* Done Column */}
              <KanbanColumn title="Done" tasks={tasksDone} status="done"
                updateTaskStatus={updateTaskStatus} deleteTask={deleteTask}
                startEditingTask={startEditingTask} editingTaskId={editingTaskId}
                editedTaskTitle={editedTaskTitle} setEditedTaskTitle={setEditedTaskTitle}
                editedTaskDescription={editedTaskDescription} setEditedTaskDescription={setEditedTaskDescription}
                saveEditedTask={saveEditedTask}
              />
            </div>
          </div>

          {/* Notion/Miro Integration Placeholder */}
          <div className="advanced-collaboration-section">
            <h3 className="section-sub-title"><Settings className="icon-inline" /> Advanced Collaboration</h3>
            <p className="collaboration-text">
              For detailed project planning, visual brainstorming, and advanced documentation,
              we integrate seamlessly with leading industry tools:
            </p>
            <div className="collaboration-links">
              <a href="https://www.notion.so/" target="_blank" rel="noopener noreferrer"
                 className="collaboration-button">
                <span className="collaboration-icon">📝</span> Notion
              </a>
              <a href="https://miro.com/" target="_blank" rel="noopener noreferrer"
                 className="collaboration-button">
                <span className="collaboration-icon">📊</span> Miro
              </a>
            </div>
          </div>

        </div>
      </div>
    );
  };

  const KanbanColumn = ({ title, tasks, status, updateTaskStatus, deleteTask,
    startEditingTask, editingTaskId, editedTaskTitle, setEditedTaskTitle,
    editedTaskDescription, setEditedTaskDescription, saveEditedTask
  }) => {
    const getStatusClass = (status) => {
      switch (status) {
        case 'todo': return 'column-todo';
        case 'in-progress': return 'column-in-progress';
        case 'done': return 'column-done';
        default: return '';
      }
    };

    const getTaskStatusButtonClass = (buttonStatus) => {
      switch (buttonStatus) {
        case 'todo': return 'task-status-button-todo';
        case 'in-progress': return 'task-status-button-in-progress';
        case 'done': return 'task-status-button-done';
        default: return '';
      }
    };

    return (
      <div className={`kanban-column ${getStatusClass(status)}`}>
        <h4 className="column-title">{title} ({tasks.length})</h4>
        <div className="task-list">
          {tasks.length === 0 ? (
            <p className="empty-column-message">No tasks here.</p>
          ) : (
            tasks.map(task => (
              <div key={task.id} className="kanban-task-card">
                {editingTaskId === task.id ? (
                  <div>
                    <input
                      type="text"
                      value={editedTaskTitle}
                      onChange={(e) => setEditedTaskTitle(e.target.value)}
                      className="edit-task-input"
                    />
                    <textarea
                      value={editedTaskDescription}
                      onChange={(e) => setEditedTaskDescription(e.target.value)}
                      rows="2"
                      className="edit-task-textarea"
                    ></textarea>
                    <div className="task-actions"> {/* Reused task-actions for consistency */}
                      <button onClick={() => saveEditedTask(task.id)} className="save-task-button">
                        <Save className="icon-small" />
                      </button>
                      <button onClick={() => setEditingTaskId(null)} className="cancel-edit-button">
                        <X className="icon-small" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h5 className="task-title">{task.title}</h5>
                    <p className="task-description">{task.description}</p>
                    <p className="task-assigned-to">Assigned to: {task.assignedTo}</p>
                    <div className="task-status-buttons">
                      {status !== 'todo' && (
                        <button onClick={() => updateTaskStatus(task.id, 'todo')} className={`task-status-button todo-btn`}>To Do</button>
                      )}
                      {status !== 'in-progress' && (
                        <button onClick={() => updateTaskStatus(task.id, 'in-progress')} className={`task-status-button in-progress-btn`}>In Progress</button>
                      )}
                      {status !== 'done' && (
                        <button onClick={() => updateTaskStatus(task.id, 'done')} className={`task-status-button done-btn`}>Done</button>
                      )}
                    </div>
                    <div className="task-actions">
                      <button onClick={() => startEditingTask(task)} className="edit-task-button">
                        <Edit className="icon-small" />
                      </button>
                      <button onClick={() => deleteTask(task.id)} className="delete-task-button">
                        <Trash2 className="icon-small" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const WhyGenerationsMatterPage = () => (
    <div className="info-page-container animate-fade-in">
      <div className="info-content">
        <h2 className="info-page-title"><BookOpen className="icon-large" /> Why Intergenerational Collaboration Matters</h2>
        <p className="info-text">
          In today's rapidly evolving technological landscape, a diverse workforce is not just a benefit, but a necessity.
          Intergenerational collaboration brings together a rich tapestry of experiences, perspectives, and skills.
          Younger generations (Gen Z, Millennials) bring fresh ideas, digital native instincts, and a willingness to challenge the status quo.
        </p>
        <p className="info-text">
          Older generations (Gen X, Boomers) contribute invaluable wisdom, deep industry knowledge, problem-solving experience,
          and a strong understanding of long-term strategic goals and organizational history.
          This synergy leads to more robust solutions, fosters a culture of continuous learning,
          and enhances innovation. Companies that embrace this diversity often see improved employee engagement,
          better decision-making, and a competitive edge in the market.
        </p>
        <p className="info-text-bold">
          By working together, different generations can mentor each other, share unique insights,
          and build a stronger, more adaptable, and more innovative company.
        </p>
      </div>
    </div>
  );

  const TechIdolsPage = () => {
    const idols = [
      { id: 1, name: "Ada Lovelace", era: "1815-1852 (Pioneer)", description: "Often considered the first computer programmer for her work on Charles Babbage's Analytical Engine.", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Ada_Lovelace_portrait.jpg/220px-Ada_Lovelace_portrait.jpg" },
      { id: 2, name: "Alan Turing", era: "1912-1954 (WWII & AI Foundations)", description: "Mathematician and computer scientist, father of AI and theoretical computer science.", image: "https://content.nationalgeographic.com.es/medio/2019/05/30/alan-turing_903af6fe_1280x1569.jpg" },
      { id: 3, name: "Grace Hopper", era: "1906-1992 (Early Software)", description: "Pioneer of computer programming, invented the first compiler.", image: "https://mujeresconciencia.com/app/uploads/2020/01/hopper_portada.jpg" },
      { id: 4, name: "Steve Jobs", era: "1955-2011 (Personal Computing)", description: "Co-founder of Apple, visionary in design and user experience.", image: "https://platform.theverge.com/wp-content/uploads/sites/2/chorus/uploads/chorus_asset/file/13873773/stevejobs.1419962519.png?quality=90&strip=all&crop=0,13.457556935818,100,73.084886128364" },
      { id: 5, name: "Bill Gates", era: "Born 1955 (Software Empires)", description: "Co-founder of Microsoft, key figure in the software revolution.", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Bill_Gates_2017_%28cropped%29.jpg/220px-Bill_Gates_2017_%28cropped%29.jpg" },
      { id: 6, name: "Linus Torvalds", era: "Born 1969 (Open Source)", description: "Creator of the Linux kernel, influential in open-source software.", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/LinuxCon_Europe_Linus_Torvalds_03_%28cropped%29.jpg/960px-LinuxCon_Europe_Linus_Torvalds_03_%28cropped%29.jpg" },
      { id: 7, name: "Mark Zuckerberg", era: "Born 1984 (Social Media & Metaverse)", description: "Co-founder of Facebook (Meta Platforms), pioneered social networking.", image: "https://www.latercera.com/resizer/v2/GRQ3SG5BVNHRNE6WICJYKVHCRU.tiff?auth=bb63bbfe16e7be8f9c756f15aa66751d5602a32a1a9cb214926f07bf0c7d2865&smart=true&width=800&height=450&quality=70" },
    ];

    const [currentIndex, setCurrentIndex] = useState(0);

    const nextIdol = () => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % idols.length);
    };

    const prevIdol = () => {
      setCurrentIndex((prevIndex) => (prevIndex - 1 + idols.length) % idols.length);
    };

    return (
      <div className="info-page-container animate-fade-in">
        <div className="info-content">
          <h2 className="info-page-title"><Star className="icon-large" /> Iconic Tech Idols Across Generations</h2>
          <div className="carousel-container">
            <div className="carousel-content" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
              {idols.map((idol) => (
                <div key={idol.id} className="carousel-item">
                  <img src={idol.image} alt={idol.name} className="idol-image" />
                  <h3 className="idol-name">{idol.name}</h3>
                  <p className="idol-era">{idol.era}</p>
                  <p className="idol-description">{idol.description}</p>
                </div>
              ))}
            </div>
            <button onClick={prevIdol} className="carousel-button prev">
              <ArrowLeft />
            </button>
            <button onClick={nextIdol} className="carousel-button next">
              <ArrowRight />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const TechNewsPage = () => {
    const newsArticles = [
      {
        id: 1,
        title: "AI Breakthrough in Medical Diagnosis",
        date: "July 10, 2025",
        summary: "A new AI model developed by HealthTech Innovations shows unprecedented accuracy in early disease detection, promising to revolutionize diagnostic processes in hospitals worldwide.",
        image: "https://www.brainvire.com/blog/wp-content/uploads/2024/02/ai-in-diagnosis.jpg",
        link: "https://www.docwirenews.com/post/the-top-6-ai-breakthroughs-in-healthcare"
      },
      {
        id: 2,
        title: "Quantum Computing Achieves New Milestones",
        date: "July 8, 2025",
        summary: "Researchers at Quantum Labs announced a significant leap in qubit stability, bringing practical quantum computers closer to reality for complex problem-solving.",
        image: "https://scx2.b-cdn.net/gfx/news/hires/2021/quantum-1.jpg",
        link: "https://pme.uchicago.edu/news/major-milestone-achieved-new-quantum-computing-architecture"
      },
      {
        id: 3,
        title: "Sustainable Tech Solutions for Urban Development",
        date: "July 5, 2025",
        summary: "EcoBuild Technologies unveils a suite of sustainable smart city solutions, focusing on energy efficiency and waste management using IoT and AI.",
        image: "https://img-cdn.thepublive.com/filters:format(webp)/industry-wired/media/post_attachments/wp-content/uploads/2024/08/How-Technology-is-Driving-Sustainable-Urban-Development.jpg",
        link: "https://www.siemens.com/global/en/company/about/strategy/siemens-megatrends/the-megatrends-series-with-omdia-urbanization.html"
      },
      {
        id: 4,
        title: "Web3 Innovations Reshaping Digital Ownership",
        date: "July 3, 2025",
        summary: "New decentralized applications are emerging, offering users greater control over their digital assets and data, signaling a shift in the internet's architecture.",
        image: "https://www.strivesystemwebtech.com/wp-content/uploads/2025/02/Web3-is-Reshaping-Digital-Marketing.webp",
        link: "https://medium.com/@zolveit/how-web3-is-reshaping-digital-ownership-and-opportunity-in-africa-1e9ef4adf436"
      }
    ];

    const [currentIndex, setCurrentIndex] = useState(0);

    const nextArticle = () => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % newsArticles.length);
    };

    const prevArticle = () => {
      setCurrentIndex((prevIndex) => (prevIndex - 1 + newsArticles.length) % newsArticles.length);
    };

    return (
      <div className="info-page-container animate-fade-in">
        <div className="info-content">
          <h2 className="info-page-title"><Newspaper className="icon-large" /> Latest Tech News</h2>
          <div className="carousel-container">
            <div className="carousel-content" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
              {newsArticles.map((article) => (
                <div key={article.id} className="carousel-item">
                  <img src={article.image} alt={`Image of ${article.title}`} className="news-image" />
                  <h3 className="news-title">{article.title}</h3>
                  <p className="news-date">{article.date}</p>
                  <p className="news-summary">{article.summary}</p>
                  <a href={article.link} target="_blank" rel="noopener noreferrer" className="news-link">
                    Read More
                  </a>
                </div>
              ))}
            </div>
            <button onClick={prevArticle} className="carousel-button prev">
              <ArrowLeft />
            </button>
            <button onClick={nextArticle} className="carousel-button next">
              <ArrowRight />
            </button>
          </div>
        </div>
      </div>
    );
  };


  // Main application rendering logic
  return (
    <div className="app-container">
      {/* Global Notification */}
      {showNotification && (
        <Notification
          message={notificationMessage}
          type={notificationType}
          onClose={() => setShowNotification(false)}
        />
      )}

      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="navbar-logo-placeholder">
          NovaGen
        </div>
        <button onClick={() => setCurrentView('landing')}
          className={`nav-button ${currentView === 'landing' ? 'active' : ''}`}>
          Home
        </button>
        <button onClick={() => setCurrentView('hackWeek')}
          className={`nav-button ${currentView === 'hackWeek' ? 'active' : ''}`}>
          Hack Week
        </button>
        {userData && ( // Show Team button only if user data exists (session started)
          <button onClick={() => setCurrentView('team')}
            className={`nav-button ${currentView === 'team' ? 'active' : ''}`}>
            My Team
          </button>
        )}
        <button onClick={() => setCurrentView('about')}
          className={`nav-button ${currentView === 'about' ? 'active' : ''}`}>
          About
        </button>
        <button onClick={() => setCurrentView('whyGenerationsMatter')}
          className={`nav-button ${currentView === 'whyGenerationsMatter' ? 'active' : ''}`}>
          Generations
        </button>
        <button onClick={() => setCurrentView('techIdols')}
          className={`nav-button ${currentView === 'techIdols' ? 'active' : ''}`}>
          Tech Idols
        </button>
        <button onClick={() => setCurrentView('techNews')}
          className={`nav-button ${currentView === 'techNews' ? 'active' : ''}`}>
          Tech News
        </button>
      </nav>

      {/* Render current view */}
      <div className="content-area">
        {currentView === 'landing' && <LandingPage onStartSession={() => setShowModal(true)} />}
        {currentView === 'hackWeek' && <HackWeekSection onMeetMyTeam={() => setCurrentView('team')} />}
        {currentView === 'team' && <TeamSection />}
        {currentView === 'about' && <AboutPage />}
        {currentView === 'whyGenerationsMatter' && <WhyGenerationsMatterPage />}
        {currentView === 'techIdols' && <TechIdolsPage />}
        {currentView === 'techNews' && <TechNewsPage />}
      </div>

      {/* Start Session Modal */}
      {showModal && <StartSessionModal onSubmit={saveUserData} onClose={() => setShowModal(false)} setNotification={setNotification} />}
    </div>
  );
}

export default App;
