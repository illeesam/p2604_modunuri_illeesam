package com.shopjoy.ecadminapi.bo.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProd;
import com.shopjoy.ecadminapi.base.ec.pd.mapper.PdProdMapper;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdProdRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import com.shopjoy.ecadminapi.common.util.VoUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class BoPdProdService {
    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");
    private final PdProdMapper pdProdMapper;
    private final PdProdRepository pdProdRepository;
    @PersistenceContext
    private EntityManager em;

    @Transactional(readOnly = true)
    public List<PdProdDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        return pdProdMapper.selectList(p);
    }

    @Transactional(readOnly = true)
    public PageResult<PdProdDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(pdProdMapper.selectPageList(p), pdProdMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional(readOnly = true)
    public PdProdDto getById(String id) {
        PdProdDto dto = pdProdMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    @Transactional
    public PdProd create(PdProd body) {
        body.setProdId("PD" + LocalDateTime.now().format(ID_FMT) + String.format("%04d", (int)(Math.random()*10000)));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PdProd saved = pdProdRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        return saved;
    }

    @Transactional
    public PdProdDto update(String id, PdProd body) {
        PdProd entity = pdProdRepository.findById(id).orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        VoUtil.voCopyExclude(body, entity, "prodId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PdProd saved = pdProdRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return getById(id);
    }

    @Transactional
    public void delete(String id) {
        PdProd entity = pdProdRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        pdProdRepository.delete(entity);
        em.flush();
        if (pdProdRepository.existsById(id))
            throw new CmBizException("데이터 삭제에 실패했습니다.");
    }
    @Transactional
    public void saveList(List<PdProd> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄 처리
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getProdId() != null)
            .map(PdProd::getProdId)
            .toList();
        if (!deleteIds.isEmpty()) {
            pdProdRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }

        // 2단계: UPDATE 처리
        for (PdProd row : rows) {
            if (!"U".equals(row.getRowStatus())) continue;
            String id = Objects.requireNonNull(row.getProdId(), "prodId must not be null");
            PdProd entity = pdProdRepository.findById(id)
                .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
            VoUtil.voCopyExclude(row, entity, "prodId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            pdProdRepository.save(entity);
        }
        em.flush();

        // 3단계: INSERT 처리
        for (PdProd row : rows) {
            if (!"I".equals(row.getRowStatus())) continue;
            row.setProdId("PD" + now.format(ID_FMT) + String.format("%04d", (int)(Math.random()*10000)));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            pdProdRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
