package com.shopjoy.ecadminapi.base.ec.st.service;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StErpVoucherLineDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StErpVoucherLine;
import com.shopjoy.ecadminapi.base.ec.st.mapper.StErpVoucherLineMapper;
import com.shopjoy.ecadminapi.base.ec.st.repository.StErpVoucherLineRepository;
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
import java.util.Objects;
import com.shopjoy.ecadminapi.common.util.VoUtil;

@Service
@RequiredArgsConstructor
public class StErpVoucherLineService {


    private final StErpVoucherLineMapper stErpVoucherLineMapper;
    private final StErpVoucherLineRepository stErpVoucherLineRepository;

    @PersistenceContext
    private EntityManager em;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public StErpVoucherLineDto getById(String id) {
        StErpVoucherLineDto result = stErpVoucherLineMapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<StErpVoucherLineDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        List<StErpVoucherLineDto> result = stErpVoucherLineMapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<StErpVoucherLineDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(stErpVoucherLineMapper.selectPageList(p), stErpVoucherLineMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(StErpVoucherLine entity) {
        int result = stErpVoucherLineMapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public StErpVoucherLine create(StErpVoucherLine entity) {
        entity.setErpVoucherLineId(CmUtil.generateId("st_erp_voucher_line"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        StErpVoucherLine result = stErpVoucherLineRepository.save(entity);
        return result;
    }

    @Transactional
    public StErpVoucherLine save(StErpVoucherLine entity) {
        if (!stErpVoucherLineRepository.existsById(entity.getErpVoucherLineId()))
            throw new CmBizException("존재하지 않는 StErpVoucherLine입니다: " + entity.getErpVoucherLineId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        StErpVoucherLine result = stErpVoucherLineRepository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        StErpVoucherLine entity = stErpVoucherLineRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        stErpVoucherLineRepository.delete(entity);
        em.flush();
        if (stErpVoucherLineRepository.existsById(id))
            throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public void saveList(List<StErpVoucherLine> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (StErpVoucherLine row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setErpVoucherLineId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("st_erp_voucher_line"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                stErpVoucherLineRepository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getErpVoucherLineId(), "erpVoucherLineId must not be null");
                StErpVoucherLine entity = stErpVoucherLineRepository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "erpVoucherLineId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                stErpVoucherLineRepository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getErpVoucherLineId(), "erpVoucherLineId must not be null");
                if (stErpVoucherLineRepository.existsById(id)) stErpVoucherLineRepository.deleteById(id);
            }
        }
        em.flush();
    }
}