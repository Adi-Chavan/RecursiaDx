#!/usr/bin/env python3
"""
Test script for matplotlib-style heatmap generation
"""

import os
import sys
import numpy as np
import matplotlib.pyplot as plt
from PIL import Image, ImageDraw
import tempfile

# Add the ML module to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def create_test_image(size=(1024, 1024), output_path=None):
    """Create a test histopathology-like image."""
    # Create base image
    img = Image.new('RGB', size, color='white')
    draw = ImageDraw.Draw(img)
    
    # Add some tissue-like regions
    for i in range(20):
        x = np.random.randint(0, size[0] - 100)
        y = np.random.randint(0, size[1] - 100)
        w = np.random.randint(50, 150)
        h = np.random.randint(50, 150)
        
        # Random color for tissue regions
        color = (
            np.random.randint(150, 255),
            np.random.randint(100, 200), 
            np.random.randint(150, 255)
        )
        draw.ellipse([x, y, x+w, y+h], fill=color)
    
    # Add some darker regions (potential tumors)
    for i in range(5):
        x = np.random.randint(0, size[0] - 80)
        y = np.random.randint(0, size[1] - 80)
        w = np.random.randint(40, 80)
        h = np.random.randint(40, 80)
        
        # Darker color for tumor-like regions
        color = (
            np.random.randint(80, 150),
            np.random.randint(50, 120), 
            np.random.randint(80, 150)
        )
        draw.ellipse([x, y, x+w, y+h], fill=color)
    
    if output_path:
        img.save(output_path)
        print(f"✅ Test image created: {output_path}")
    
    return img

def create_sample_heatmap_data(size=(64, 64)):
    """Create sample heatmap data for demonstration."""
    # Create tumor probability heatmap
    x = np.linspace(-2, 2, size[1])
    y = np.linspace(-2, 2, size[0])
    X, Y = np.meshgrid(x, y)
    
    # Create multiple gaussian peaks (tumor regions)
    heatmap = np.zeros_like(X)
    
    # Add tumor hotspots
    centers = [(-1, -1), (1, 0.5), (0, 1.2), (-0.5, 0.8)]
    for cx, cy in centers:
        intensity = np.random.uniform(0.6, 1.0)
        sigma = np.random.uniform(0.3, 0.8)
        peak = intensity * np.exp(-((X - cx)**2 + (Y - cy)**2) / (2 * sigma**2))
        heatmap += peak
    
    # Add some noise
    heatmap += np.random.normal(0, 0.05, heatmap.shape)
    
    # Clip to valid range
    heatmap = np.clip(heatmap, 0, 1)
    
    return heatmap

def demonstrate_matplotlib_heatmaps():
    """Demonstrate different matplotlib heatmap styles."""
    print("🎨 Demonstrating Matplotlib-style Heatmaps...")
    
    # Create output directory
    output_dir = "heatmap_examples"
    os.makedirs(output_dir, exist_ok=True)
    
    # Generate sample data
    heatmap_data = create_sample_heatmap_data()
    
    # Test image for overlay
    test_img = create_test_image()
    test_img_resized = test_img.resize(heatmap_data.shape[::-1])
    
    # Different colormap styles
    colormaps = [
        ('hot', 'Hot (Classic Medical)'),
        ('viridis', 'Viridis (Perceptually Uniform)'),
        ('plasma', 'Plasma (High Contrast)'),
        ('inferno', 'Inferno (Dark Background)'),
        ('jet', 'Jet (Rainbow)'),
        ('coolwarm', 'Cool-Warm (Diverging)')
    ]
    
    print(f"\n📊 Generating {len(colormaps)} different heatmap styles...")
    
    for i, (cmap_name, description) in enumerate(colormaps):
        print(f"   {i+1}. {description}")
        
        # Create figure with subplots
        fig, axes = plt.subplots(1, 3, figsize=(15, 5))
        fig.suptitle(f'{description}', fontsize=16, fontweight='bold')
        
        # 1. Heatmap only
        im1 = axes[0].imshow(heatmap_data, cmap=cmap_name, interpolation='bilinear')
        axes[0].set_title('Heatmap Only')
        axes[0].axis('off')
        cbar1 = plt.colorbar(im1, ax=axes[0], shrink=0.8)
        cbar1.set_label('Tumor Probability', fontweight='bold')
        
        # 2. Overlay on image
        axes[1].imshow(np.array(test_img_resized))
        im2 = axes[1].imshow(heatmap_data, cmap=cmap_name, alpha=0.6, interpolation='bilinear')
        axes[1].set_title('Overlay on Tissue')
        axes[1].axis('off')
        cbar2 = plt.colorbar(im2, ax=axes[1], shrink=0.8)
        cbar2.set_label('Tumor Probability', fontweight='bold')
        
        # 3. Contour style
        contour = axes[2].contourf(heatmap_data, levels=20, cmap=cmap_name, alpha=0.8)
        axes[2].contour(heatmap_data, levels=20, colors='black', alpha=0.3, linewidths=0.5)
        axes[2].set_title('Contour Style')
        axes[2].axis('off')
        cbar3 = plt.colorbar(contour, ax=axes[2], shrink=0.8)
        cbar3.set_label('Tumor Probability', fontweight='bold')
        
        plt.tight_layout()
        
        # Save
        output_path = os.path.join(output_dir, f"heatmap_{cmap_name}.png")
        plt.savefig(output_path, dpi=150, bbox_inches='tight', facecolor='white')
        plt.close()
    
    print(f"✅ All heatmaps saved to: {os.path.abspath(output_dir)}")

def demonstrate_advanced_heatmaps():
    """Demonstrate advanced heatmap features."""
    print("\n🔬 Demonstrating Advanced Heatmap Features...")
    
    output_dir = "advanced_heatmaps"
    os.makedirs(output_dir, exist_ok=True)
    
    # Generate multiple heatmap types
    tumor_prob = create_sample_heatmap_data()
    confidence = np.random.uniform(0.5, 1.0, tumor_prob.shape)
    risk_score = tumor_prob * confidence
    
    heatmaps = {
        'Tumor Probability': tumor_prob,
        'Confidence': confidence,
        'Risk Score': risk_score
    }
    
    # 1. Multi-panel comparison
    fig, axes = plt.subplots(2, 3, figsize=(18, 12))
    fig.suptitle('Multi-Panel Heatmap Analysis', fontsize=20, fontweight='bold')
    
    colormaps = ['hot', 'viridis', 'plasma']
    
    for i, (title, data) in enumerate(heatmaps.items()):
        # Top row: individual heatmaps
        im_top = axes[0, i].imshow(data, cmap=colormaps[i], interpolation='bilinear')
        axes[0, i].set_title(title, fontsize=14, fontweight='bold')
        axes[0, i].axis('off')
        cbar_top = plt.colorbar(im_top, ax=axes[0, i], shrink=0.8)
        cbar_top.set_label(title, fontweight='bold')
        
        # Bottom row: with contours
        im_bottom = axes[1, i].imshow(data, cmap=colormaps[i], alpha=0.8, interpolation='bilinear')
        contour = axes[1, i].contour(data, levels=10, colors='white', alpha=0.8, linewidths=1)
        axes[1, i].clabel(contour, inline=True, fontsize=8, fmt='%.2f')
        axes[1, i].set_title(f'{title} with Contours', fontsize=14, fontweight='bold')
        axes[1, i].axis('off')
        cbar_bottom = plt.colorbar(im_bottom, ax=axes[1, i], shrink=0.8)
        cbar_bottom.set_label(title, fontweight='bold')
    
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, "multi_panel_analysis.png"), 
                dpi=200, bbox_inches='tight', facecolor='white')
    plt.close()
    
    # 2. Statistical overlay
    fig, ax = plt.subplots(1, 1, figsize=(10, 8))
    
    im = ax.imshow(tumor_prob, cmap='hot', interpolation='bilinear')
    
    # Add statistical annotations
    mean_val = np.mean(tumor_prob)
    max_val = np.max(tumor_prob)
    std_val = np.std(tumor_prob)
    
    # Find hotspots (values > mean + 2*std)
    hotspots = np.where(tumor_prob > mean_val + 2*std_val)
    ax.scatter(hotspots[1], hotspots[0], c='cyan', s=30, alpha=0.8, 
               marker='x', linewidths=2, label='Hotspots')
    
    ax.set_title('Tumor Probability with Statistical Annotations', 
                fontsize=16, fontweight='bold')
    ax.axis('off')
    
    # Add colorbar
    cbar = plt.colorbar(im, ax=ax, shrink=0.8, aspect=20)
    cbar.set_label('Tumor Probability', fontsize=12, fontweight='bold')
    
    # Add text annotations
    ax.text(0.02, 0.98, f'Mean: {mean_val:.3f}', transform=ax.transAxes, 
            fontsize=12, fontweight='bold', color='white',
            bbox=dict(boxstyle='round', facecolor='black', alpha=0.7))
    ax.text(0.02, 0.92, f'Max: {max_val:.3f}', transform=ax.transAxes, 
            fontsize=12, fontweight='bold', color='white',
            bbox=dict(boxstyle='round', facecolor='black', alpha=0.7))
    ax.text(0.02, 0.86, f'Std: {std_val:.3f}', transform=ax.transAxes, 
            fontsize=12, fontweight='bold', color='white',
            bbox=dict(boxstyle='round', facecolor='black', alpha=0.7))
    
    ax.legend(loc='upper right')
    
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, "statistical_overlay.png"), 
                dpi=200, bbox_inches='tight', facecolor='white')
    plt.close()
    
    print(f"✅ Advanced heatmaps saved to: {os.path.abspath(output_dir)}")

def main():
    """Main demonstration function."""
    print("🎯 Matplotlib Heatmap Demonstration")
    print("=" * 50)
    
    try:
        # Basic heatmaps
        demonstrate_matplotlib_heatmaps()
        
        # Advanced features
        demonstrate_advanced_heatmaps()
        
        print("\n✅ All demonstrations completed successfully!")
        print("\n📂 Check the following directories for outputs:")
        print("   - heatmap_examples/")
        print("   - advanced_heatmaps/")
        
        # Show sample code usage
        print("\n💡 Sample Usage in Your Pipeline:")
        print("""
from pipeline import HistopathologyPipeline

# Initialize pipeline
pipeline = HistopathologyPipeline()

# Generate matplotlib heatmap
result = pipeline.generate_matplotlib_heatmap(
    image_path="your_image.jpg",
    output_path="heatmap.png",
    heatmap_type="tumor_probability",
    colormap="hot",
    show_overlay=True,
    show_colorbar=True
)

# Generate multiple heatmaps
multi_result = pipeline.generate_multiple_heatmaps(
    image_path="your_image.jpg",
    output_dir="./heatmaps/",
    heatmap_types=["tumor_probability", "confidence", "risk_score"],
    colormaps=["hot", "viridis", "plasma"]
)
        """)
        
    except Exception as e:
        print(f"❌ Error during demonstration: {str(e)}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())