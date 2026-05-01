package com.shopjoy.ecadminapi.base.ec.mb.service;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbDeviceTokenDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbDeviceToken;
import com.shopjoy.ecadminapi.base.ec.mb.data.vo.MbDeviceTokenReq;
import com.shopjoy.ecadminapi.base.ec.mb.mapper.MbDeviceTokenMapper;
import com.shopjoy.ecadminapi.base.ec.mb.repository.MbDeviceTokenRepository;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.shopjoy.ecadminapi.common.util.CmUtil;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import com.shopjoy.ecadminapi.co.auth.security.AuthPrincipal;

@Service
@RequiredArgsConstructor
public class MbDeviceTokenService {

    private final MbDeviceTokenMapper mapper;
    private final MbDeviceTokenRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public MbDeviceTokenDto getById(String id) {
        // mb_device_token :: select one :: id [orm:mybatis]
        return mapper.selectById(id);
    }

    @Transactional(readOnly = true)
    public List<MbDeviceTokenDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // mb_device_token :: select list :: p [orm:mybatis]
        return mapper.selectList(p);
    }

    @Transactional(readOnly = true)
    public PageResult<MbDeviceTokenDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // mb_device_token :: select page :: [orm:mybatis]
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(MbDeviceToken entity) {
        // mb_device_token :: update :: [orm:mybatis]
        return mapper.updateSelective(entity);
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public MbDeviceToken create(MbDeviceToken entity) {
        entity.setDeviceTokenId(CmUtil.generateId("mb_device_token"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // mb_device_token :: insert or update :: [orm:jpa]
        return repository.save(entity);
    }

    @Transactional
    public MbDeviceToken save(MbDeviceToken entity) {
        // mb_device_token :: select one :: deviceTokenId [orm:jpa]
        MbDeviceToken existing = repository.findById(entity.getDeviceTokenId())
                .orElseThrow(() -> new CmBizException("존재하지 않는 디바이스 토큰입니다: " + entity.getDeviceTokenId()));
        entity.setRegBy(existing.getRegBy());
        entity.setRegDate(existing.getRegDate());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // mb_device_token :: insert or update :: [orm:jpa]
        return repository.save(entity);
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id))
            throw new CmBizException("존재하지 않는 디바이스 토큰입니다: " + id);
        // mb_device_token :: delete :: id [orm:jpa]
        repository.deleteById(id);
    }

    // ── _row_status 기반 저장 ────────────────────────────────────

    @Transactional
    public MbDeviceToken saveByRowStatus(MbDeviceTokenReq req) {
        return doSaveByRowStatus(req);
    }

    @Transactional
    public List<MbDeviceToken> saveListByRowStatus(List<MbDeviceTokenReq> list) {
        List<MbDeviceToken> result = new ArrayList<>();
        for (MbDeviceTokenReq req : list.stream().filter(r -> "D".equals(r.getRowStatus())).toList()) result.add(doSaveByRowStatus(req));
        for (MbDeviceTokenReq req : list.stream().filter(r -> "U".equals(r.getRowStatus())).toList()) result.add(doSaveByRowStatus(req));
        for (MbDeviceTokenReq req : list.stream().filter(r -> "I".equals(r.getRowStatus())).toList()) result.add(doSaveByRowStatus(req));
        return result;
    }

    private MbDeviceToken doSaveByRowStatus(MbDeviceTokenReq req) {
        return switch (req.getRowStatus()) {
            case "I" -> create(req.toEntity());
            case "U" -> save(req.toEntity());
            case "D" -> {
                delete(req.getDeviceTokenId());
                yield null;
            }
            default -> throw new CmBizException("올바르지 않은 _row_status: " + req.getRowStatus());
        };
    }

}
