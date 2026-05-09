package com.shopjoy.ecadminapi.base.ec.mb.service;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberSnsDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMemberSns;
import com.shopjoy.ecadminapi.base.ec.mb.mapper.MbMemberSnsMapper;
import com.shopjoy.ecadminapi.base.ec.mb.repository.MbMemberSnsRepository;
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
public class MbMemberSnsService {

    private final MbMemberSnsMapper mbMemberSnsMapper;
    private final MbMemberSnsRepository mbMemberSnsRepository;

    @PersistenceContext
    private EntityManager em;

    public MbMemberSnsDto.Item getById(String id) {
        MbMemberSnsDto.Item dto = mbMemberSnsMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public MbMemberSns findById(String id) {
        return mbMemberSnsRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return mbMemberSnsRepository.existsById(id);
    }

    public List<MbMemberSnsDto.Item> getList(MbMemberSnsDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return mbMemberSnsMapper.selectList(req);
    }

    public MbMemberSnsDto.PageResponse getPageData(MbMemberSnsDto.Request req) {
        PageHelper.addPaging(req);
        MbMemberSnsDto.PageResponse res = new MbMemberSnsDto.PageResponse();
        List<MbMemberSnsDto.Item> list = mbMemberSnsMapper.selectPageList(req);
        long count = mbMemberSnsMapper.selectPageCount(req);
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public MbMemberSns create(MbMemberSns body) {
        body.setMemberSnsId(CmUtil.generateId("mb_member_sns"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        MbMemberSns saved = mbMemberSnsRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public MbMemberSns save(MbMemberSns entity) {
        if (!existsById(entity.getMemberSnsId()))
            throw new CmBizException("존재하지 않는 MbMemberSns입니다: " + entity.getMemberSnsId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        MbMemberSns saved = mbMemberSnsRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public MbMemberSns update(String id, MbMemberSns body) {
        MbMemberSns entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "memberSnsId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        MbMemberSns saved = mbMemberSnsRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public MbMemberSns updatePartial(MbMemberSns entity) {
        if (entity.getMemberSnsId() == null) throw new CmBizException("memberSnsId 가 필요합니다.");
        if (!existsById(entity.getMemberSnsId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getMemberSnsId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = mbMemberSnsMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        MbMemberSns entity = findById(id);
        mbMemberSnsRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public void saveList(List<MbMemberSns> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getMemberSnsId() != null)
            .map(MbMemberSns::getMemberSnsId)
            .toList();
        if (!deleteIds.isEmpty()) {
            mbMemberSnsRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<MbMemberSns> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getMemberSnsId() != null)
            .toList();
        for (MbMemberSns row : updateRows) {
            MbMemberSns entity = findById(row.getMemberSnsId());
            VoUtil.voCopyExclude(row, entity, "memberSnsId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            mbMemberSnsRepository.save(entity);
        }
        em.flush();

        List<MbMemberSns> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (MbMemberSns row : insertRows) {
            row.setMemberSnsId(CmUtil.generateId("mb_member_sns"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            mbMemberSnsRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
