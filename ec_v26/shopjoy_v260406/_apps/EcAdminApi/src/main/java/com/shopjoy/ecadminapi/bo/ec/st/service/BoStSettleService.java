package com.shopjoy.ecadminapi.bo.ec.st.service;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettle;
import com.shopjoy.ecadminapi.base.ec.st.mapper.StSettleMapper;
import com.shopjoy.ecadminapi.base.ec.st.repository.StSettleRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class BoStSettleService {
    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");
    private final StSettleMapper stSettleMapper;
    private final StSettleRepository stSettleRepository;
    @PersistenceContext
    private EntityManager em;

    @Transactional(readOnly = true)
    public List<StSettleDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        return stSettleMapper.selectList(p);
    }

    @Transactional(readOnly = true)
    public PageResult<StSettleDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(stSettleMapper.selectPageList(p), stSettleMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional(readOnly = true)
    public StSettleDto getById(String id) {
        StSettleDto dto = stSettleMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    @Transactional
    public StSettle create(StSettle body) {
        body.setSettleId("ST" + LocalDateTime.now().format(ID_FMT) + String.format("%04d", (int)(Math.random()*10000)));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        StSettle saved = stSettleRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        return saved;
    }

    @Transactional
    public StSettleDto update(String id, StSettle body) {
        StSettle entity = stSettleRepository.findById(id).orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        StSettle saved = stSettleRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return getById(id);
    }

    @Transactional
    public void delete(String id) {
        StSettle entity = stSettleRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        stSettleRepository.delete(entity);
        em.flush();
        if (stSettleRepository.existsById(id))
            throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public StSettleDto changeStatus(String id, String statusCd) {
        StSettle entity = stSettleRepository.findById(id).orElseThrow(() -> new CmBizException("존재하지 않습니다: " + id));
        entity.setSettleStatusCdBefore(entity.getSettleStatusCd());
        entity.setSettleStatusCd(statusCd);
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        StSettle saved = stSettleRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return getById(id);
    }
}
