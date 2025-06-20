# Product Requirements Document (PRD)

## Product Title: Flowo Online Flower Shop

**Version**: 1.0
**Author**: Group 04
**Date**: 2025-05-30

---

## 1. Overview

### 1.1 Purpose

To develop a responsive, data-driven web platform that enables customers to browse, filter, and purchase fresh flowers online. The system will support dynamic pricing, real-time inventory updates, personalized recommendations, and administrative management features.

### 1.2 Scope

This platform will support two main user roles: **Customers** and **Admins**. It includes capabilities for real-time catalog browsing, dynamic flower pricing, secured checkout, AI-driven recommendations, admin dashboards, and chatbot support.

---

## 2. Problem Statement

Traditional flower sales methods limit accessibility, fail to reflect real-time stock and freshness, and lack promotional flexibility. This results in missed opportunities and inefficient operations.

**Solution**: A fully online platform with:

* Real-time inventory and freshness indicators
* Smart dynamic pricing
* Admin-controlled promotions and stock
* AI-powered product recommendations and support

---

## 3. Target Users

| User Type        | Description                                                          |
| ---------------- | -------------------------------------------------------------------- |
| Shoppers         | Browse, purchase, and track flower orders for various occasions.     |
| Registered Users | Access order history, receive offers, and use personalized features. |
| Shop Admins      | Manage inventory, orders, pricing, and customer accounts.            |

---

## 4. Key Features

### 4.1 Functional Features

* **Dynamic Flower Catalog**: Filters by type, occasion, freshness.
* **Smart Pricing Engine**: Adjusts prices based on time, stock, events.
* **Secure Checkout**: Multiple payment options and delivery tracking.
* **User Accounts**: Order history, address book, wishlist.
* **Admin Dashboard**: Inventory management, analytics, order control.
* **AI-Powered Recommendation Engine**: Personalized suggestions.
* **Chatbot Support**: Order tracking and customer service via natural language.

### 4.2 Non-Functional Requirements

* **Usability**: Mobile responsive, intuitive UI, quick checkout.
* **Security**: End-to-end encryption, GDPR compliant, 2FA for admin.
* **Reliability**: Real-time inventory sync, high uptime during peak seasons.
* **Performance**: <2s response for 95% of requests, optimized image loading.
* **Scalability**: Handles 100+ concurrent users with no degradation.

---

## 5. User Stories

### Customer

* As a customer, I want to browse flowers by freshness and occasion.
* As a customer, I want to track the status of my orders.
* As a returning customer, I want to reorder previous purchases with one click.
* As a user, I want personalized suggestions while typing in the search bar.

### Admin

* As an admin, I want to dynamically adjust prices based on freshness.
* As an admin, I want to create promotional campaigns.
* As an admin, I want to generate and export sales reports.

---

## 6. Use Case Overview

### 6.1 Customer Use Cases

* **Sign Up / Login**
* **Browse / Search Products**
* **View Product Details**
* **Add/Remove to Cart**
* **Checkout (Initiate and Complete)**
* **Track Orders & View History**
* **Save Addresses**
* **Receive Promotions**
* **Interact with Chatbot / RAG Chatbot**
* **Get Recommendations**

### 6.2 Admin Use Cases

* **Manage Users, Products, Categories**
* **Add/Edit/Delete Flower Listings**
* **Track & Manage Orders**
* **Configure Pricing Rules**
* **Apply Special Offers**
* **Assign Flower Condition**
* **Manage Inventory**
* **Generate Reports**

---

## 7. System Architecture Notes

### 7.1 Platform

* **Frontend**: React.js or Vue.js with responsive design
* **Backend**: Node.js or Django with RESTful APIs
* **Database**: PostgreSQL or MongoDB
* **AI/ML Layer**: Recommendation Engine (collaborative filtering + NLP)
* **Hosting**: Cloud-based (AWS, GCP, or Azure)

### 7.2 External Integrations

* **Payment Gateway**: PayPal, Stripe, VNPAY
* **Notification Services**: Email (SMTP), SMS
* **Chatbot**: AI (OpenAI/GPT API) + Retrieval Augmented Generation (RAG)

---

## 8. Success Metrics

| Metric                      | Target              |
| --------------------------- | ------------------- |
| System Uptime               | 99.9%               |
| Avg Page Load               | <2s                 |
| Checkout Conversion Rate    | >15%                |
| Customer Retention          | >50% within 60 days |
| Cart Abandonment            | <20%                |
| Chatbot Satisfaction Rating | >80%                |

---

## 9. Future Enhancements (Post-MVP)

* Mobile App version
* Loyalty points and gift cards
* Integration with logistics APIs for real-time delivery tracking
* Multilingual support
* Augmented Reality flower preview

---

## 10. Appendices

* **Use Case Details**: See attached SRS use-case section.
* **User Journey Diagrams**: \[To be designed]
* **Database Schema**: \[To be defined in design phase]

---

Let me know if you'd like this PRD exported as a `.md` file or tailored further for a Jira epic, Confluence, or GitHub Wiki format.
