package com.shopjoy.ecadminapi.base.ec.mb.service;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbDeviceTokenDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbDeviceToken;
import com.shopjoy.ecadminapi.base.ec.mb.mapper.MbDeviceTokenMapper;
import com.shopjoy.ecadminapi.base.ec.mb.repository.MbDeviceTokenRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import com.shopjoy.ecadminapi.common.util.VoUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MbDeviceTokenService {

    private final MbDeviceTokenMapper mbDeviceTokenMapper;
    private final MbDeviceTokenRepository mbDeviceTokenRepository;

    @PersistenceContext
    private EntityManager em;

    public MbDeviceTokenDto.Item getById(String id) {
        MbDeviceTokenDto.Item dto = mbDeviceTokenMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public MbDeviceToken findById(String id) {
        return mbDeviceTokenRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return mbDeviceTokenRepository.existsById(id);
    }

    public List<MbDeviceTokenDto.Item> getList(MbDeviceTokenDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return mbDeviceTokenMapper.selectList(VoUtil.voToMap(req));
    }

    public MbDeviceTokenDto.PageResponse getPageData(MbDeviceTokenDto.Request req) {
        PageHelper.addPaging(req);
        MbDeviceTokenDto.PageResponse res = new MbDeviceTokenDto.PageResponse();
        List<MbDeviceTokenDto.Item> list = mbDeviceTokenMapper.selectPageList(VoUtil.voToMap(req));
        long count = mbDeviceTokenMapper.selectPageCount(VoUtil.voToMap(req));
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public MbDeviceToken create(MbDeviceToken body) {
        body.setDeviceTokenId(CmUtil.generateId("mb_device_token"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        MbDeviceToken saved = mbDeviceTokenRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public MbDeviceToken save(MbDeviceToken entity) {
        if (!existsById(entity.getDeviceTokenId()))
            throw new CmBizException("존재하지 않는 MbDeviceToken입니다: " + entity.getDeviceTokenId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        MbDeviceToken saved = mbDeviceTokenRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public MbDeviceToken update(String id, MbDeviceToken body) {
        MbDeviceToken entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "deviceTokenId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        MbDeviceToken saved = mbDeviceTokenRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public MbDeviceToken updateSelective(MbDeviceToken entity) {
        if (entity.getDeviceTokenId() == null) throw new CmBizException("deviceTokenId 가 필요합니다.");
        if (!existsById(entity.getDeviceTokenId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getDeviceTokenId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = mbDeviceTokenMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        MbDeviceToken entity = findById(id);
        mbDeviceTokenRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public void saveList(List<MbDeviceToken> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getDeviceTokenId() != null)
            .map(MbDeviceToken::getDeviceTokenId)
            .toList();
        if (!deleteIds.isEmpty()) {
            mbDeviceTokenRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<MbDeviceToken> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getDeviceTokenId() != null)
            .toList();
        for (MbDeviceToken row : updateRows) {
            MbDeviceToken entity = findById(row.getDeviceTokenId());
            VoUtil.voCopyExclude(row, entity, "deviceTokenId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            mbDeviceTokenRepository.save(entity);
        }
        em.flush();

        List<MbDeviceToken> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (MbDeviceToken row : insertRows) {
            row.setDeviceTokenId(CmUtil.generateId("mb_device_token"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            mbDeviceTokenRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
