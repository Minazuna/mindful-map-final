# One-Way ANOVA & Tukey HSD - Statistical Basis and Formulas

## Overview

This document explains the formulas and computation steps for **One-Way ANOVA** and **Tukey HSD** as used in our backend analysis. 


## 1. One-Way ANOVA

### **Purpose**
One-Way ANOVA (Analysis of Variance) tests if there are any statistically significant differences between the means of three or more independent groups (e.g., mood scores for different activities).

### **Formulas & Steps**

#### **Step 1: Calculate the Overall Mean**
\[
\bar{X} = \frac{1}{N} \sum_{i=1}^{k} \sum_{j=1}^{n_i} X_{ij}
\]
- \( \bar{X} \): Overall mean of all data
- \( k \): Number of groups (activities)
- \( n_i \): Number of samples in group \( i \)
- \( X_{ij} \): Value \( j \) in group \( i \)
- \( N = \sum_{i=1}^{k} n_i \): Total number of samples

#### **Step 2: Calculate Sum of Squares Between Groups (SSB)**
\[
SSB = \sum_{i=1}^{k} n_i (\bar{X}_i - \bar{X})^2
\]
- \( \bar{X}_i \): Mean of group \( i \)

#### **Step 3: Calculate Sum of Squares Within Groups (SSW)**
\[
SSW = \sum_{i=1}^{k} \sum_{j=1}^{n_i} (X_{ij} - \bar{X}_i)^2
\]

#### **Step 4: Calculate Mean Squares**
\[
MSB = \frac{SSB}{k-1}
\]
\[
MSW = \frac{SSW}{N-k}
\]

#### **Step 5: Calculate the F-Statistic**
\[
F = \frac{MSB}{MSW}
\]

#### **Step 6: Find the p-value**
- The p-value is computed from the F-distribution with \( k-1 \) and \( N-k \) degrees of freedom.
- If \( p < 0.05 \), at least one group mean is significantly different.

---

## 2. Tukey HSD (Honestly Significant Difference)

### **Purpose**
Tukey HSD is a post-hoc test used after ANOVA to determine **which specific pairs of groups** (e.g., activities) have statistically significant differences in their means.

### **Formulas & Steps**

#### **Step 1: Calculate Mean Difference for Each Pair**
\[
\text{MeanDiff}_{i,j} = |\bar{X}_i - \bar{X}_j|
\]

#### **Step 2: Calculate the Standard Error (SE)**
\[
SE = \sqrt{\frac{MSW}{n}}
\]
- \( n \): Number of samples per group (if unequal, use harmonic mean or software's approach)

#### **Step 3: Calculate the Tukey HSD Statistic (q)**
\[
q = \frac{\text{MeanDiff}_{i,j}}{SE}
\]

#### **Step 4: Compare q to Critical Value**
- Use the studentized range distribution to find the critical value for \( q \) at the desired significance level (usually 0.05).
- If \( q \) is greater than the critical value, the difference is significant.

#### **Step 5: Adjusted p-value**
- The test provides an adjusted p-value for each pair, accounting for multiple comparisons.

---

## 3. Output Interpretation

- **F-value**: How much the group means differ relative to the variation within groups.
- **p-value**: Probability that the observed differences are due to chance.
- **Tukey HSD Table**: For each pair, shows:
  - `group1`, `group2`: The compared activities
  - `meandiff`: Difference in means
  - `p-adj`: Adjusted p-value
  - `lower`, `upper`: Confidence interval for the difference
  - `reject`: Whether the difference is statistically significant

---

## 4. References

- [Wikipedia: One-way ANOVA](https://en.wikipedia.org/wiki/One-way_analysis_of_variance)
- [Wikipedia: Tukey's range test](https://en.wikipedia.org/wiki/Tukey%27s_range_test)
- [statsmodels Documentation](https://www.statsmodels.org/stable/generated/statsmodels.stats.multicomp.pairwise_tukeyhsd.html)

