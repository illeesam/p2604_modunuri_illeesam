package com.shopjoy.ecadminapi.base.ec.mb.service;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberSnsDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMemberSns;
import com.shopjoy.ecadminapi.base.ec.mb.mapper.MbMemberSnsMapper;
import com.shopjoy.ecadminapi.base.ec.mb.repository.MbMemberSnsRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import com.shopjoy.ecadminapi.common.util.VoUtil;

@Service
@RequiredArgsConstructor
public class MbMemberSnsService {

    private final MbMemberSnsMapper mbMemberSnsMapper;
    private final MbMemberSnsRepository mbMemberSnsRepository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public MbMemberSnsDto getById(String id) {
        MbMemberSnsDto result = mbMemberSnsMapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<MbMemberSnsDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        List<MbMemberSnsDto> result = mbMemberSnsMapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<MbMemberSnsDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(mbMemberSnsMapper.selectPageList(p), mbMemberSnsMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(MbMemberSns entity) {
        int result = mbMemberSnsMapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public MbMemberSns create(MbMemberSns entity) {
        entity.setMemberSnsId(CmUtil.generateId("mb_member_sns"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        MbMemberSns result = mbMemberSnsRepository.save(entity);
        return result;
    }

    @Transactional
    public MbMemberSns save(MbMemberSns entity) {
        if (!mbMemberSnsRepository.existsById(entity.getMemberSnsId()))
            throw new CmBizException("존재하지 않는 MbMemberSns입니다: " + entity.getMemberSnsId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        MbMemberSns result = mbMemberSnsRepository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        if (!mbMemberSnsRepository.existsById(id))
            throw new CmBizException("존재하지 않는 MbMemberSns입니다: " + id);
        mbMemberSnsRepository.deleteById(id);
    }

    @Transactional
    public void saveList(List<MbMemberSns> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (MbMemberSns row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setMemberSnsId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("mb_member_sns"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                mbMemberSnsRepository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getMemberSnsId(), "memberSnsId must not be null");
                MbMemberSns entity = mbMemberSnsRepository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "memberSnsId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                mbMemberSnsRepository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getMemberSnsId(), "memberSnsId must not be null");
                if (mbMemberSnsRepository.existsById(id)) mbMemberSnsRepository.deleteById(id);
            }
        }
    }
}