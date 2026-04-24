package com.shopjoy.ecadminapi.base.ec.mb.service;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberAddrDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMemberAddr;
import com.shopjoy.ecadminapi.base.ec.mb.mapper.MbMemberAddrMapper;
import com.shopjoy.ecadminapi.base.ec.mb.repository.MbMemberAddrRepository;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import com.shopjoy.ecadminapi.auth.security.AuthPrincipal;

@Service
@RequiredArgsConstructor
public class MbMemberAddrService {

    private final MbMemberAddrMapper mapper;
    private final MbMemberAddrRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public MbMemberAddrDto getById(String id) {
        MbMemberAddrDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<MbMemberAddrDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        List<MbMemberAddrDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<MbMemberAddrDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(MbMemberAddr entity) {
        int result = mapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public MbMemberAddr create(MbMemberAddr entity) {
        entity.setMemberAddrId(CmUtil.generateId("mb_member_addr"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        MbMemberAddr result = repository.save(entity);
        return result;
    }

    @Transactional
    public MbMemberAddr save(MbMemberAddr entity) {
        if (!repository.existsById(entity.getMemberAddrId()))
            throw new CmBizException("존재하지 않는 MbMemberAddr입니다: " + entity.getMemberAddrId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        MbMemberAddr result = repository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id))
            throw new CmBizException("존재하지 않는 MbMemberAddr입니다: " + id);
        repository.deleteById(id);
    }

}
