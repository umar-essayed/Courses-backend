# خريطة نقاط النهاية الشاملة - Sinceides Platform

## 🔐 Authentication Endpoints
| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| POST | `/api/auth/register` | تسجيل مستخدم جديد | ❌ | - |
| POST | `/api/auth/login` | تسجيل الدخول | ❌ | - |
| POST | `/api/auth/refresh` | تجديد التوكن | ❌ | - |
| POST | `/api/auth/logout` | تسجيل الخروج | ❌ | - |

## 👤 User Management Endpoints
| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| GET | `/api/users/:id` | الحصول على بيانات مستخدم | ✅ | All |
| PUT | `/api/users/:id` | تحديث بيانات مستخدم | ✅ | All |
| GET | `/api/users/:id/report` | تقرير مفصل للمستخدم | ✅ | All |
| DELETE | `/api/users/:id` | حذف مستخدم (soft delete) | ✅ | ADMIN |
| POST | `/api/users/:id/restore` | استعادة مستخدم محذوف | ✅ | ADMIN |
| PUT | `/api/users/:id/block` | حظر مستخدم | ✅ | ADMIN |
| PUT | `/api/users/:id/unblock` | إلغاء حظر مستخدم | ✅ | ADMIN |
| GET | `/api/users` | قائمة المستخدمين | ✅ | ADMIN, HR |

## 📚 Course Management Endpoints
| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| GET | `/api/courses` | قائمة الكورسات العامة | ❌ | - |
| POST | `/api/courses` | إنشاء كورس جديد | ✅ | ADMIN, INSTRUCTOR |
| GET | `/api/courses/:id` | تفاصيل كورس | ❌ | - |
| PUT | `/api/courses/:id` | تحديث كورس | ✅ | ADMIN, INSTRUCTOR |
| DELETE | `/api/courses/:id` | حذف كورس (soft delete) | ✅ | ADMIN, INSTRUCTOR |
| POST | `/api/courses/:id/restore` | استعادة كورس محذوف | ✅ | ADMIN, INSTRUCTOR |

## 📖 Lesson Management Endpoints
| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| POST | `/api/courses/:courseId/lessons` | إنشاء درس جديد | ✅ | INSTRUCTOR |
| GET | `/api/courses/:courseId/lessons` | قائمة دروس الكورس | ✅ | All |
| GET | `/api/courses/:courseId/lessons/:id` | تفاصيل درس | ✅ | All |
| PUT | `/api/courses/:courseId/lessons/:id` | تحديث درس | ✅ | INSTRUCTOR |
| DELETE | `/api/courses/:courseId/lessons/:id` | حذف درس (soft delete) | ✅ | ADMIN, INSTRUCTOR |
| POST | `/api/courses/:courseId/lessons/:id/restore` | استعادة درس محذوف | ✅ | ADMIN, INSTRUCTOR |
| DELETE | `/api/courses/:courseId/lessons/:id/permanent` | حذف نهائي للدرس | ✅ | ADMIN |

## 🏷️ Category Management Endpoints
| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| POST | `/api/categories` | إنشاء فئة جديدة | ✅ | ADMIN |
| GET | `/api/categories/:id` | تفاصيل فئة | ❌ | - |
| PUT | `/api/categories/:id` | تحديث فئة | ✅ | ADMIN |
| DELETE | `/api/categories/:id` | حذف فئة (soft delete) | ✅ | ADMIN |
| POST | `/api/categories/:id/restore` | استعادة فئة محذوفة | ✅ | ADMIN |
| DELETE | `/api/categories/:id/permanent` | حذف نهائي للفئة | ✅ | ADMIN |

## 📝 Enrollment Management Endpoints
| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| GET | `/api/enrollments` | قائمة التسجيلات | ✅ | ADMIN, HR |
| GET | `/api/enrollments/:userId/:courseId` | تفاصيل تسجيل | ✅ | All |
| POST | `/api/enrollments` | تسجيل في كورس | ✅ | All |
| PUT | `/api/enrollments/progress` | تحديث تقدم الطالب | ✅ | All |

## 🛣️ Roadmap Management Endpoints
| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| POST | `/api/roadmaps` | إنشاء خارطة طريق | ✅ | ADMIN, INSTRUCTOR |
| GET | `/api/roadmaps` | قائمة خرائط الطريق | ✅ | All |
| GET | `/api/roadmaps/:id` | تفاصيل خارطة طريق | ✅ | All |
| POST | `/api/roadmaps/:id/enroll` | التسجيل في خارطة طريق | ✅ | All |

## 🏆 Challenge Management Endpoints
| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| POST | `/api/challenges` | إنشاء تحدي جديد | ✅ | ADMIN |
| GET | `/api/challenges` | قائمة التحديات | ✅ | All |
| GET | `/api/challenges/:id` | تفاصيل تحدي | ✅ | All |
| POST | `/api/challenges/:id/submit` | إرسال إجابات التحدي | ✅ | All |
| GET | `/api/challenges/:id/leaderboard` | لوحة المتصدرين | ✅ | All |

## 📋 Exam Management Endpoints
| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| POST | `/api/exams` | إنشاء امتحان جديد | ✅ | ADMIN, INSTRUCTOR |
| GET | `/api/exams/:id` | تفاصيل امتحان | ✅ | All |
| POST | `/api/exams/:id/submit` | إرسال إجابات الامتحان | ✅ | All |
| GET | `/api/certificates` | شهادات المستخدم | ✅ | All |
| GET | `/api/certificates/verify/:code` | التحقق من شهادة | ❌ | - |

## 🎓 Learning Profile Endpoints
| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| POST | `/api/users/:userId/learning-profile` | إنشاء/تحديث ملف التعلم | ✅ | All |
| GET | `/api/users/:userId/learning-profile/analyze` | تحليل أنماط التعلم | ✅ | All |

## 🎯 Recommendation Endpoints
| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| GET | `/api/users/:userId/recommendations` | الحصول على التوصيات | ✅ | All |

## 🧠 Adaptive Learning Endpoints
| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| POST | `/api/adaptive/:userId/courses/:courseId/lessons/:lessonId/adjust` | تعديل صعوبة المحتوى | ✅ | All |
| POST | `/api/users/:userId/learning-path` | إنشاء مسار تعلم مخصص | ✅ | All |

## 📊 Analytics Endpoints
| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| GET | `/api/analytics/:userId/courses/:courseId/prediction` | توقع إكمال الكورس | ✅ | All |
| GET | `/api/analytics/courses/:courseId/at-risk-students` | الطلاب المعرضون للخطر | ✅ | ADMIN, INSTRUCTOR |

## 🎧 Support Endpoints
| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| POST | `/api/support/conversations` | إنشاء محادثة دعم | ✅ | All |
| POST | `/api/support/conversations/:id/messages` | إرسال رسالة دعم | ✅ | All |

## 👨‍💼 Admin Endpoints
| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| GET | `/api/admin/dashboard` | لوحة تحكم الإدارة | ✅ | ADMIN |

## 👥 HR Endpoints
| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| GET | `/api/hr/instructors` | قائمة المدربين | ✅ | ADMIN, HR |
| POST | `/api/hr/assign-instructor` | تعيين مدرب لـ HR | ✅ | ADMIN, HR |

## 🗑️ Bin Management Endpoints
| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| GET | `/api/bin` | العناصر المحذوفة | ✅ | ADMIN |
| POST | `/api/:collection/:id/restore` | استعادة عنصر | ✅ | ADMIN |
| DELETE | `/api/:collection/:id/permanent` | حذف نهائي | ✅ | ADMIN |

## 📁 File Management Endpoints
| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| POST | `/api/upload` | رفع ملف | ✅ | All |
| DELETE | `/api/files` | حذف ملف | ✅ | All |

## 🏥 Health Check
| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| GET | `/api/health` | فحص حالة الخادم | ❌ | - |

## 📚 Documentation
| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| GET | `/docs` | توثيق API (Swagger) | ❌ | - |

---

## 🔑 Roles Hierarchy
- **ADMIN**: صلاحيات كاملة
- **INSTRUCTOR**: إدارة الكورسات والدروس
- **HR**: إدارة المدربين والمستخدمين
- **STUDENT**: الوصول للمحتوى والتسجيل
- **SUPPORT**: إدارة محادثات الدعم

## 📊 Total Endpoints Count: 67 endpoints
