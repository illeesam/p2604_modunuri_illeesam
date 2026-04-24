package com.shopjoy.ecadminapi.base.ec.st.service;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleCloseDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleClose;
import com.shopjoy.ecadminapi.base.ec.st.mapper.StSettleCloseMapper;
import com.shopjoy.ecadminapi.base.ec.st.repository.StSettleCloseRepository;
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
public class StSettleCloseService {


    private final StSettleCloseMapper mapper;
    private final StSettleCloseRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public StSettleCloseDto getById(String id) {
        StSettleCloseDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<StSettleCloseDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        List<StSettleCloseDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<StSettleCloseDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(StSettleClose entity) {
        int result = mapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public StSettleClose create(StSettleClose entity) {
        entity.setSettleCloseId(CmUtil.generateId("st_settle_close"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        StSettleClose result = repository.save(entity);
        return result;
    }

    @Transactional
    public StSettleClose save(StSettleClose entity) {
        if (!repository.existsById(entity.getSettleCloseId()))
            throw new CmBizException("존재하지 않는 StSettleClose입니다: " + entity.getSettleCloseId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        StSettleClose result = repository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id))
            throw new CmBizException("존재하지 않는 StSettleClose입니다: " + id);
        repository.deleteById(id);
    }

}
