package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyVendorUserDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyVendorUser;
import com.shopjoy.ecadminapi.base.sy.mapper.SyVendorUserMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyVendorUserRepository;
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
public class SyVendorUserService {

    private final SyVendorUserMapper syVendorUserMapper;
    private final SyVendorUserRepository syVendorUserRepository;

    @PersistenceContext
    private EntityManager em;

    public SyVendorUserDto.Item getById(String id) {
        SyVendorUserDto.Item dto = syVendorUserMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public SyVendorUser findById(String id) {
        return syVendorUserRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return syVendorUserRepository.existsById(id);
    }

    public List<SyVendorUserDto.Item> getList(SyVendorUserDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return syVendorUserMapper.selectList(VoUtil.voToMap(req));
    }

    public SyVendorUserDto.PageResponse getPageData(SyVendorUserDto.Request req) {
        PageHelper.addPaging(req);
        SyVendorUserDto.PageResponse res = new SyVendorUserDto.PageResponse();
        List<SyVendorUserDto.Item> list = syVendorUserMapper.selectPageList(VoUtil.voToMap(req));
        long count = syVendorUserMapper.selectPageCount(VoUtil.voToMap(req));
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public SyVendorUser create(SyVendorUser body) {
        body.setVendorUserId(CmUtil.generateId("sy_vendor_user"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        SyVendorUser saved = syVendorUserRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public SyVendorUser save(SyVendorUser entity) {
        if (!existsById(entity.getVendorUserId()))
            throw new CmBizException("존재하지 않는 SyVendorUser입니다: " + entity.getVendorUserId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyVendorUser saved = syVendorUserRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public SyVendorUser update(String id, SyVendorUser body) {
        SyVendorUser entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "vendorUserId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyVendorUser saved = syVendorUserRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public SyVendorUser updateSelective(SyVendorUser entity) {
        if (entity.getVendorUserId() == null) throw new CmBizException("vendorUserId 가 필요합니다.");
        if (!existsById(entity.getVendorUserId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getVendorUserId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = syVendorUserMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        SyVendorUser entity = findById(id);
        syVendorUserRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public void saveList(List<SyVendorUser> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getVendorUserId() != null)
            .map(SyVendorUser::getVendorUserId)
            .toList();
        if (!deleteIds.isEmpty()) {
            syVendorUserRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<SyVendorUser> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getVendorUserId() != null)
            .toList();
        for (SyVendorUser row : updateRows) {
            SyVendorUser entity = findById(row.getVendorUserId());
            VoUtil.voCopyExclude(row, entity, "vendorUserId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            syVendorUserRepository.save(entity);
        }
        em.flush();

        List<SyVendorUser> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (SyVendorUser row : insertRows) {
            row.setVendorUserId(CmUtil.generateId("sy_vendor_user"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            syVendorUserRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
