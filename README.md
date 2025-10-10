# RecursiaDx

AI-powered digital pathology platform for tumor detection and medical image analysis.

## Overview

RecursiaDx is a comprehensive platform that uses machine learning to analyze medical images and detect tumors in pathological samples. The system provides interactive heatmap visualizations to help medical professionals identify areas of concern.

## Features

- Tumor detection using AI/ML models
- Interactive heatmap visualizations
- Medical image analysis dashboard
- Automated report generation

## Heatmap Visualizations

### Basic Tumor Detection
![Basic Heatmap](ml/visible_heatmaps/basic_heatmap.png)

### Different Visualization Styles

![Viridis Heatmap](ml/heatmap_examples/heatmap_viridis.png)
*Viridis color scheme*

![Plasma Heatmap](ml/heatmap_examples/heatmap_plasma.png)
*Plasma color scheme*

![Hot Heatmap](ml/heatmap_examples/heatmap_hot.png)
*Hot color scheme*

![Coolwarm Heatmap](ml/heatmap_examples/heatmap_coolwarm.png)
*Coolwarm color scheme*

### Advanced Analysis

![Multi-Panel Analysis](ml/advanced_heatmaps/multi_panel_analysis.png)
*Multi-panel analysis view*

![Statistical Overlay](ml/advanced_heatmaps/statistical_overlay.png)
*Statistical overlay visualization*

### Dashboard Integration

![Dashboard Risk Score](ml/dashboard_integration_example/dashboard_risk_score_plasma.png)
*Risk score visualization*

![Dashboard Confidence](ml/dashboard_integration_example/dashboard_confidence_viridis.png)
*Confidence level display*

## Quick Start

1. Clone the repository
2. Install dependencies for backend, frontend, and ML modules
3. Run the development servers
4. Upload medical images for analysis

## Tech Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- ML: Python + PyTorch
- Database: MongoDB