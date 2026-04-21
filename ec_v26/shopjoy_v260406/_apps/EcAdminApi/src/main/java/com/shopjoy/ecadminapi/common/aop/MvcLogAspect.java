package com.shopjoy.ecadminapi.common.aop;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartHttpServletRequest;

import jakarta.servlet.http.HttpServletRequest;

@Aspect
@Component
public class MvcLogAspect {
    private static final Logger logger = LoggerFactory.getLogger(MvcLogAspect.class);

    // 컴포넌트 스캔
    @Around("execution(* com.shopjoy..controller..*Controller.*(..)) || " +
            "execution(* com.shopjoy..client..*Client.*(..)) || " +
            "execution(* com.shopjoy..service..*ServiceImpl.*(..)) || " +
            "execution(* com.shopjoy..service..*Service.*(..)) || " +
            "execution(* com.shopjoy..repository..*Repository.*(..)) || " +
            "execution(* com.shopjoy..mapper..*Mapper.*(..)) || " +
            "execution(* com.shopjoy..xxxxxxxxx..*Service.*(..))")
    public Object logging(ProceedingJoinPoint thisJoinPoint) throws Throwable {
        Object target = thisJoinPoint.getTarget();
        String simpleName = (target != null) ? target.getClass().getSimpleName()
                : thisJoinPoint.getSignature().getDeclaringTypeName();
        String simpleNameUpper = simpleName.toUpperCase();
        String methodName = thisJoinPoint.getSignature().getName();

        Object[] signatureArgs = thisJoinPoint.getArgs();
        int idx = 0;
        String strInParams = "";
        String strOutParams = "";
        String outObjName = "";
        String reqInfo = "";

        if (signatureArgs != null) {
            for (Object signatureArg : signatureArgs) {
                if (signatureArgs.length == 1) {
                    strInParams = String.valueOf(signatureArg);
                } else {
                    strInParams += "\n    args[" + idx++ + "] " + signatureArg;
                }
            }
        }

        if (simpleNameUpper.indexOf("TOKENSERVICE") > -1) {
            ;
        } else if (simpleNameUpper.indexOf("CONTROLLER") > -1) {

            for (Object obj : thisJoinPoint.getArgs()) {
                if (obj instanceof HttpServletRequest || obj instanceof MultipartHttpServletRequest) {
                    HttpServletRequest request = (HttpServletRequest) obj;
                    reqInfo += request.getMethod();
                    reqInfo += " " + request.getRequestURL().toString()
                            + (request.getQueryString() != null ? "?" + request.getQueryString() : "");
                    String token = request.getHeader("Authorization");
                    reqInfo += (token != null ? " [" + token + "]" : "");
                    break;
                }
            }

            if (-1 < strInParams.indexOf("{") && -1 < strInParams.indexOf("}")) {
                strInParams = strInParams.replace(", ", "\n ____ ");
                strInParams = strInParams.replace("{", "\n ____ ");
                strInParams = strInParams.replace("}", "");
                strInParams = strInParams.replace("=", " = ");
            }
            logger.info("■■ ▶ : [" + simpleName + " | " + methodName + "] " + outObjName + " : " + reqInfo + "\n"
                    + strInParams);
        } else if (simpleNameUpper.indexOf("CLIENT") > -1) {

            for (Object obj : thisJoinPoint.getArgs()) {
                if (obj instanceof HttpServletRequest || obj instanceof MultipartHttpServletRequest) {
                    HttpServletRequest request = (HttpServletRequest) obj;
                    reqInfo += request.getMethod();
                    reqInfo += " " + request.getRequestURL().toString()
                            + (request.getQueryString() != null ? "?" + request.getQueryString() : "");
                    String token = request.getHeader("Authorization");
                    reqInfo += (token != null ? " [" + token + "]" : "");
                    break;
                }
            }

            if (-1 < strInParams.indexOf("{") && -1 < strInParams.indexOf("}")) {
                strInParams = strInParams.replace(", ", "\n ____ ");
                strInParams = strInParams.replace("{", "\n ____ ");
                strInParams = strInParams.replace("}", "");
                strInParams = strInParams.replace("=", " = ");
            }
            logger.info("■■ ■ : [" + simpleName + " | " + methodName + "] " + outObjName + " : " + reqInfo + "\n"
                    + strInParams);
        } else if (simpleNameUpper.indexOf("SERVICE") > -1) {
            logger.info("■■ ▶▶ : [" + simpleName + " | " + methodName + "] " + outObjName + " : " + strInParams);
        } else if (simpleNameUpper.indexOf("$PROXY") > -1) {
            logger.info("■■ ▶▶▶ [" + simpleName + " | " + methodName + "] " + outObjName + " : " + strInParams);
        } else if (simpleNameUpper.indexOf("DAO") > -1) {
            logger.info("■■ ▶▶▶ [" + simpleName + " | " + methodName + "] " + outObjName + " : " + strInParams);
        } else if (simpleNameUpper.indexOf("MAPPER") > -1) {
            logger.info("■■ ▶▶▶ [" + simpleName + " | " + methodName + "] " + outObjName + " : " + strInParams);
        } else if (simpleNameUpper.indexOf("REPOSITORY") > -1) {
            logger.info("■■ ▶▶▶ [" + simpleName + " | " + methodName + "] " + outObjName + " : " + strInParams);
        } else {
            logger.info("■■ ▶ : ELSE [" + simpleName + " | " + methodName + "] " + outObjName + " : " + strInParams);
        }
        Object result = null;
        try {
            result = thisJoinPoint.proceed();
        } catch (Throwable ex) {
            logger.error("Exception in AOP around [" + simpleName + "] " + methodName, ex);
            throw ex;
        }
        if (result != null) {
            outObjName = result.getClass().getSimpleName();
            if (result instanceof String) {
                strOutParams = (String) result;
                // }else if (result instanceof List) {
                // strOutParams = ((List) result).toString();
                // }else if (result instanceof ArrayList) {
                // strOutParams = ((ArrayList) result).toString();
                // }else if (result instanceof Map) {
                // strOutParams = ((Map) result).toString();
                // }else if (result instanceof HashMap) {
                // strOutParams = ((HashMap) result).toString();
                // }else if (result instanceof JSONArray) {
                // strOutParams = ((JSONArray) result).toString();
                // }else if (result instanceof AjaxResult) {
                // strOutParams = ((AjaxResult) result).toString();
            }
        }

        if (simpleNameUpper.indexOf("TOKENSERVICE") > -1) {
            ;
        } else if (simpleNameUpper.indexOf("CONTROLLER") > -1) {
            // logger.info("■■ ◀ " + simpleName + " " + methodName + "(), oc:" + outObjName
            // + ", od:" + strOutParams);
                logger.info("■■ ◀ : " + simpleName + " " + methodName + "(), oc:" + outObjName + ", od:"
                    + (strOutParams != null && strOutParams.length() > 400 ? strOutParams.substring(0, 300) : strOutParams)
                    + ", " + reqInfo);
        } else if (simpleNameUpper.indexOf("SERVICE") > -1) {
            // logger.info("■■ ◀◀ " + simpleName + " " + methodName + "(), oc:" +
            // outObjName + ", od:" + strOutParams);
                logger.info("■■ ◀◀ : " + simpleName + " " + methodName + "(), oc:" + outObjName + ", od:"
                    + (strOutParams != null && strOutParams.length() > 400 ? strOutParams.substring(0, 300) : strOutParams));
        } else if (simpleNameUpper.indexOf("$PROXY") > -1) {
            // logger.info("■■ ◀◀◀ " + simpleName + " " + methodName + "(), oc:" +
            // outObjName + ", od:" + strOutParams);
                logger.info("■■ ◀◀◀ : " + simpleName + " " + methodName + "(), oc:" + outObjName + ", od:"
                    + (strOutParams != null && strOutParams.length() > 400 ? strOutParams.substring(0, 300) : strOutParams));
        } else if (simpleNameUpper.indexOf("DAO") > -1) {
            // logger.info("■■ ◀◀◀ " + simpleName + " " + methodName + "(), oc:" +
            // outObjName + ", od:" + strOutParams);
                logger.info("■■ ◀◀◀ : " + simpleName + " " + methodName + "(), oc:" + outObjName + ", od:"
                    + (strOutParams != null && strOutParams.length() > 400 ? strOutParams.substring(0, 300) : strOutParams));
        } else if (simpleNameUpper.indexOf("MAPPER") > -1) {
            // logger.info("■■ ◀◀◀ " + simpleName + " " + methodName + "(), oc:" +
            // outObjName + ", od:" + strOutParams);
                logger.info("■■ ◀◀◀ : " + simpleName + " " + methodName + "(), oc:" + outObjName + ", od:"
                    + (strOutParams != null && strOutParams.length() > 400 ? strOutParams.substring(0, 300) : strOutParams));
        } else if (simpleNameUpper.indexOf("REPOSITORY") > -1) {
            // logger.info("■■ ◀◀◀ " + simpleName + " " + methodName + "(), oc:" +
            // outObjName + ", od:" + strOutParams);
            logger.info("■■ ▶▶▶ : " + simpleName + " " + methodName + "(), oc:" + outObjName + ", od:"
                    + (strOutParams != null && strOutParams.length() > 400 ? strOutParams.substring(0, 300) : strOutParams));
        } else {
            // logger.info("■■ ◀ : ELSE " + simpleName + " " + methodName + "(), oc:" +
            // outObjName + ", od:" + strOutParams);
                logger.info("■■ ◀ : ELSE " + simpleName + " " + methodName + "(), oc:" + outObjName + ", od:"
                    + (strOutParams != null && strOutParams.length() > 400 ? strOutParams.substring(0, 300) : strOutParams));
        }
        return result;
    }

    // @AfterReturning(" execution(* ssi.itg..controller.*Controller.*(..)) or
    // execution(* ssi.itg..service.*.*(..)) or execution(*
    // ssi.itg..repository.*.*(..)) or execution(* ssi.itg..dao.*Dao.*(..)) ")
    // public void afterReturning(JoinPoint joinPoint) {
    // System.out.println("### " + joinPoint.getSignature().getName() + " : after
    // returning execute");
    // }

}