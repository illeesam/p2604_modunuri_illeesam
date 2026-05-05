package com.shopjoy.ecadminapi.bo.ec.st.service;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleRawDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleRaw;
import com.shopjoy.ecadminapi.base.ec.st.mapper.StSettleRawMapper;
import com.shopjoy.ecadminapi.base.ec.st.repository.StSettleRawRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class BoStSettleRawService {
    private final StSettleRawMapper stSettleRawMapper;
    private final StSettleRawRepository stSettleRawRepository;
    @PersistenceContext
    private EntityManager em;

    @Transactional(readOnly = true)
    public List<StSettleRawDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        return stSettleRawMapper.selectList(p);
    }

    @Transactional(readOnly = true)
    public PageResult<StSettleRawDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(stSettleRawMapper.selectPageList(p), stSettleRawMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional(readOnly = true)
    public StSettleRawDto getById(String id) {
        StSettleRawDto dto = stSettleRawMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    @Transactional
    public StSettleRaw create(StSettleRaw body) {
        body.setSettleRawId(CmUtil.generateId("st_settle_raw"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        StSettleRaw saved = stSettleRawRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        return saved;
    }

    @Transactional
    public StSettleRawDto update(String id, StSettleRaw body) {
        StSettleRaw entity = stSettleRawRepository.findById(id).orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        StSettleRaw saved = stSettleRawRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return getById(id);
    }

    @Transactional
    public void delete(String id) {
        StSettleRaw entity = stSettleRawRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        stSettleRawRepository.delete(entity);
        em.flush();
        if (stSettleRawRepository.existsById(id))
            throw new CmBizException("데이터 삭제에 실패했습니다.");
    }
}
